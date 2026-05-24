import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, UnauthorizedError } from "@/lib/auth";

/**
 * POST /api/escrow/release
 *
 * Releases a single booking from escrow → RELEASED.
 * Providers can trigger this manually once service is complete.
 * Can also be called by a scheduled job (cron) for automatic 48h release.
 *
 * Body: { bookingId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required." }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where:   { id: bookingId },
      include: { provider: { select: { userId: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    // Only the provider or an admin can release escrow
    const isProvider = booking.provider?.userId === auth.userId;
    const isAdmin    = auth.role === "ADMIN";
    if (!isProvider && !isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if ((booking.status as string) !== "IN_ESCROW") {
      return NextResponse.json({ error: `Booking is not IN_ESCROW (current: ${booking.status}).` }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data:  { status: "RELEASED" as never, escrowReleasedAt: new Date() },
    });

    return NextResponse.json({ booking: updated });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    console.error("[escrow/release POST]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

/**
 * POST /api/escrow/release/auto
 *
 * Called by a cron job (e.g. Vercel cron, GitHub Actions, or external scheduler).
 * Releases all IN_ESCROW bookings whose eventDate was more than 48 hours ago.
 * Secured with CRON_SECRET environment variable.
 */
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h ago

  const result = await prisma.booking.updateMany({
    where: {
      status:    "IN_ESCROW" as never,
      eventDate: { lte: cutoff },
    },
    data: {
      status:           "RELEASED" as never,
      escrowReleasedAt: new Date(),
    },
  });

  console.log(`[escrow auto-release] Released ${result.count} bookings.`);
  return NextResponse.json({ released: result.count });
}
