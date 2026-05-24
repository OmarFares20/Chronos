import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;
    const { status } = await req.json(); // e.g. "CONFIRMED", "CANCELLED", "COMPLETED"

    const validStatuses = ["PENDING", "CONFIRMED", "DECLINED", "IN_ESCROW", "RELEASED", "CANCELLED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    // Role verification logic
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { provider: true, customer: true, event: true }
    });

    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const isCustomer = booking.customerId === auth.userId;
    const isProvider = booking.provider.userId === auth.userId;

    if (!isCustomer && !isProvider) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Providers can CONFIRM, DECLINE, or COMPLETED. Customers can CANCEL or pay (IN_ESCROW).
    const s = status as string;
    if (isProvider && (s === "CONFIRMED" || s === "COMPLETED" || s === "DECLINED")) {
      // Allowed
    } else if (isCustomer && (s === "CANCELLED" || s === "IN_ESCROW")) {
      // Allowed
    } else {
       return NextResponse.json({ error: "Action not permitted for this role." }, { status: 403 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: status as never },
      include: {
        event: true,
        customer: { select: { name: true, email: true } },
        package: true,
      }
    });

    // Automatically update event status to CONFIRMED or COMPLETED if a booking progresses
    if ((updated.status as string) === "CONFIRMED") {
      await prisma.event.update({ where: { id: updated.eventId }, data: { status: "CONFIRMED" as never }});
    } else if ((updated.status as string) === "COMPLETED") {
      await prisma.event.update({ where: { id: updated.eventId }, data: { status: "COMPLETED" as never }});
    }

    return NextResponse.json({ booking: updated });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
