import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// ── GET /api/bookings/[id] ────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        event:    { select: { name: true, type: true } },
        provider: { select: { businessName: true, location: true } },
        customer: { select: { name: true, email: true } },
        package:  { select: { name: true, duration: true, price: true } },
        payment:  true,
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const isCustomer = booking.customerId === auth.userId;
    const isProvider = await prisma.providerProfile.findFirst({
      where: { id: booking.providerId, userId: auth.userId },
    });

    if (!isCustomer && !isProvider) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── PATCH /api/bookings/[id] ──────────────────────────────────────────────────
//
// Allowed transitions by role:
//
//   PROVIDER → CONFIRMED    (accept a PENDING booking)
//   PROVIDER → DECLINED     (decline a PENDING booking)
//
//   CUSTOMER → CANCELLED    (cancel before payment, only if PENDING or CONFIRMED)
//   CUSTOMER → RELEASED     (mark service as received after payment; only if IN_ESCROW)
//
// The provider can NEVER mark a booking as received/released —
// that is an exclusive customer action to protect escrow integrity.
//
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const VALID = ["PENDING", "CONFIRMED", "DECLINED", "IN_ESCROW", "RELEASED", "CANCELLED", "COMPLETED"];
    if (!status || !VALID.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const isCustomer = booking.customerId === auth.userId;
    const isProvider = booking.provider.userId === auth.userId;

    if (!isCustomer && !isProvider) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // ── Authorization matrix ──────────────────────────────────────────────────
    if (status === "CONFIRMED" || status === "DECLINED") {
      // Only the provider can confirm or decline
      if (!isProvider) {
        return NextResponse.json(
          { error: "Only the provider can confirm or decline a booking." },
          { status: 403 }
        );
      }
      if (booking.status !== "PENDING") {
        return NextResponse.json(
          { error: `Cannot ${status.toLowerCase()} a booking that is already ${booking.status}.` },
          { status: 400 }
        );
      }
    } else if (status === "RELEASED") {
      // Only the CUSTOMER can mark service as received (release escrow)
      if (!isCustomer) {
        return NextResponse.json(
          { error: "Only the customer can mark a service as received." },
          { status: 403 }
        );
      }
      if (booking.status !== "IN_ESCROW") {
        return NextResponse.json(
          { error: "Payment can only be released for bookings that are IN_ESCROW." },
          { status: 400 }
        );
      }
    } else if (status === "CANCELLED") {
      // Customer can cancel while still PENDING or CONFIRMED (before payment)
      if (!isCustomer) {
        return NextResponse.json(
          { error: "Only the customer can cancel a booking." },
          { status: 403 }
        );
      }
      if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
        return NextResponse.json(
          { error: "Cannot cancel a booking that has already been paid or completed." },
          { status: 400 }
        );
      }
    } else {
      // Any other status transition is not permitted via this endpoint
      return NextResponse.json(
        { error: "This status transition is not permitted." },
        { status: 403 }
      );
    }

    // ── Perform update ────────────────────────────────────────────────────────
    const updated = await prisma.booking.update({
      where: { id },
      data:  { status: status as never },
      include: {
        event:    true,
        customer: { select: { name: true, email: true } },
        package:  true,
      },
    });

    // Keep event status in sync
    if (status === "CONFIRMED") {
      await prisma.event.update({
        where: { id: updated.eventId },
        data:  { status: "CONFIRMED" as never },
      }).catch(() => {});
    } else if (status === "RELEASED") {
      await prisma.event.update({
        where: { id: updated.eventId },
        data:  { status: "COMPLETED" as never },
      }).catch(() => {});
    }

    return NextResponse.json({ booking: updated });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[bookings/:id PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
