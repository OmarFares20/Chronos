import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const ReviewSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "CUSTOMER") return NextResponse.json({ error: "Only customers can review" }, { status: 403 });

    const body = await req.json();
    const result = ReviewSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { bookingId, rating, comment } = result.data;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (booking.customerId !== auth.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    if ((booking.status as string) !== "COMPLETED") return NextResponse.json({ error: "Event must be completed to review." }, { status: 400 });

    const review = await prisma.review.create({
      data: {
        bookingId,
        customerId: auth.userId,
        providerId: booking.providerId,
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Handle Prisma unique constraint error if review already exists
    if ((e as any).code === 'P2002') return NextResponse.json({ error: "Review already exists for this booking." }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
