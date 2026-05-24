import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const VALID_METHODS = ["CARD", "FAWRY", "VODAFONE_CASH", "INSTAPAY", "BANK_TRANSFER"];

/**
 * POST /api/bookings/[id]/pay
 * Body: { method: PaymentMethod, reference?: string }
 *
 * - Guards: booking must be CONFIRMED; caller must be the customer
 * - Creates a Payment record
 * - Updates booking status to IN_ESCROW
 * - Creates a notification for the provider
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;
    const body = await req.json();
    const { method, reference } = body;

    if (!method || !VALID_METHODS.includes(method)) {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }

    // Load booking with provider
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        provider: { select: { userId: true, businessName: true } },
        customer: { select: { name: true } },
        event:    { select: { name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    // Only the customer can pay
    if (booking.customerId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // Guard: only CONFIRMED bookings can be paid
    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: `Cannot pay for a booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Check no payment already exists
    const existingPayment = await prisma.payment.findUnique({ where: { bookingId: id } });
    if (existingPayment) {
      return NextResponse.json({ error: "This booking has already been paid." }, { status: 409 });
    }

    const amount       = Number(booking.amount);
    const platformFee  = Math.round(amount * 0.05);
    const providerPayout = amount - platformFee;

    // Create payment + update booking atomically
    const [payment, updatedBooking] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          bookingId: id,
          amount,
          method:    method as never,
          status:    "COMPLETED",
          reference: reference || null,
          paidAt:    new Date(),
        },
      }),
      prisma.booking.update({
        where: { id },
        data: {
          status:          "IN_ESCROW",
          platformFee,
          providerPayout,
        },
      }),
    ]);

    // Note: notifications are derived from bookings/messages — no separate model

    return NextResponse.json({ payment, booking: updatedBooking }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[bookings/:id/pay POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
