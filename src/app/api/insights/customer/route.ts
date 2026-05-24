import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, UnauthorizedError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);

    // ── Pull everything in parallel ──────────────────────────────────────────
    const [events, bookings, reviews] = await Promise.all([
      prisma.event.findMany({
        where: { customerId: auth.userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.findMany({
        where: { customerId: auth.userId },
        include: {
          provider: { select: { id: true, businessName: true, avatarUrl: true, categories: true } },
          package:  { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.findMany({
        where: { customerId: auth.userId },
      }),
    ]);

    // ── Aggregate stats ────────────────────────────────────────────────────────
    const totalOccasions  = events.length;
    const totalBookings   = bookings.length;
    const paidBookings     = bookings.filter(b => ["IN_ESCROW", "RELEASED"].includes(b.status));
    const totalSpent       = paidBookings.reduce((s, b) => s + Number(b.amount || 0), 0);
    const inEscrow        = bookings.filter(b => b.status === "IN_ESCROW").reduce((s, b) => s + Number(b.amount || 0), 0);
    const confirmedCount  = bookings.filter(b => ["CONFIRMED", "IN_ESCROW", "RELEASED"].includes(b.status)).length;
    const cancelledCount  = bookings.filter(b => b.status === "CANCELLED").length;
    const reviewsGiven    = reviews.length;

    // Upcoming occasions (future dates, not cancelled)
    const now = new Date();
    const upcomingOccasions = events.filter(e => new Date(e.date) > now && e.status !== "CANCELLED").length;

    // Favourite providers (most booked)
    const providerCount: Record<string, { name: string; count: number; avatarUrl: string | null; categories: string[] }> = {};
    for (const b of bookings) {
      if (!b.provider) continue;
      const pid = b.provider.id;
      if (!providerCount[pid]) {
        providerCount[pid] = { name: b.provider.businessName, count: 0, avatarUrl: b.provider.avatarUrl, categories: b.provider.categories };
      }
      providerCount[pid].count++;
    }
    const favouriteProviders = Object.entries(providerCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([id, v]) => ({ id, ...v }));

    // Monthly spend (last 6 months)
    const monthlySpend: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const amount = bookings
        .filter(b => {
          const bd = new Date(b.createdAt);
          return bd.getFullYear() === d.getFullYear() && bd.getMonth() === d.getMonth()
            && ["IN_ESCROW", "RELEASED"].includes(b.status);
        })
        .reduce((s, b) => s + Number(b.amount || 0), 0);
      monthlySpend.push({ month: label, amount });
    }

    // Occasion types breakdown
    const typeBreakdown: Record<string, number> = {};
    for (const e of events) {
      typeBreakdown[e.type] = (typeBreakdown[e.type] || 0) + 1;
    }

    return NextResponse.json({
      stats: {
        totalOccasions,
        totalBookings,
        totalSpent,
        inEscrow,
        upcomingOccasions,
        confirmedCount,
        cancelledCount,
        reviewsGiven,
      },
      favouriteProviders,
      monthlySpend,
      typeBreakdown,
    });
  } catch (e) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    console.error("[insights/customer]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
