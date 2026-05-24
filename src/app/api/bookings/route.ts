import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { z } from "zod";

const BookingSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  providerId: z.string().min(1, "Provider ID is required"),
  packageId: z.string().min(1, "Package ID is required"),
  eventDate: z.string().optional(),
  message: z.string().optional(),
});

// GET /api/bookings
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);

    const page  = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);
    const skip  = (page - 1) * limit;

    const bookings = auth.role === "PROVIDER"
      ? await prisma.booking.findMany({
          where: { provider: { userId: auth.userId } },
          skip,
          take: limit,
          include: {
            event: true,
            customer: { select: { name: true, email: true } },
            package: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.booking.findMany({
          where: { customerId: auth.userId },
          skip,
          take: limit,
          include: {
            event: true,
            provider: { select: { businessName: true, location: true } },
            package: true,
          },
          orderBy: { createdAt: "desc" },
        });

    const total = auth.role === "PROVIDER"
      ? await prisma.booking.count({ where: { provider: { userId: auth.userId } } })
      : await prisma.booking.count({ where: { customerId: auth.userId } });

    return NextResponse.json({ bookings, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (e: unknown) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/bookings — create booking
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);

    // Only customers can create bookings
    if (auth.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Only customers can create bookings." }, { status: 403 });
    }

    const body = await req.json();
    const result = BookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { eventId, providerId, packageId, eventDate, message } = result.data;

    // Verify event belongs to this customer
    const event = await prisma.event.findFirst({
      where: { id: eventId, customerId: auth.userId },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // SECURITY FIX (SA12): source amount from DB package, never from client body
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 });
    }

    const amount         = Number(pkg.price);
    const platformFee    = Math.round(amount * 0.05 * 100) / 100;
    const providerPayout = amount - platformFee;

    const booking = await prisma.booking.create({
      data: {
        eventId,
        customerId:    auth.userId,
        providerId,
        packageId,
        eventDate:     eventDate ? new Date(eventDate) : null,
        message:       message || null,
        amount,
        platformFee,
        providerPayout,
        status:        "PENDING",
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    console.error("[bookings POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
