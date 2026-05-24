import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const PaySchema = z.object({
  method: z.enum(["CARD", "FAWRY", "VODAFONE_CASH", "INSTAPAY", "BANK_TRANSFER"]),
  reference: z.string().min(1, "Reference is required").max(200).optional(),
});

/**
 * POST /api/bookings/[id]/pay
 * Validates with Zod, creates Payment record, moves booking → IN_ESCROW.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    const parsed = PaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { method, reference } = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        provider: { select: { userId: true, businessName: true } },
        customer: { select: { name: true } },
        event:    { select: { name: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (booking.customerId !== auth.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    if (booking.status !== "CONFIRMED") {
      return NextResponse.json({ error: `Cannot pay for a booking with status: ${booking.status}` }, { status: 400 });
    }

    const existingPayment = await prisma.payment.findUnique({ where: { bookingId: id } });
    if (existingPayment) return NextResponse.json({ error: "This booking has already been paid." }, { status: 409 });

    const amount        = Number(booking.amount);
    const platformFee   = Math.round(amount * 0.05);
    const providerPayout = amount - platformFee;

    const [payment, updatedBooking] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          bookingId: id,
          amount,
          method,
          status:    "COMPLETED",
          reference: reference || null,
          paidAt:    new Date(),
        },
      }),
      prisma.booking.update({
        where: { id },
        data: { status: "IN_ESCROW", platformFee, providerPayout },
      }),
    ]);

    return NextResponse.json({ payment, booking: updatedBooking }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[bookings/:id/pay POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
