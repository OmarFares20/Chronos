import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, UnauthorizedError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "PROVIDER")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const profile = await prisma.providerProfile.findUnique({
      where: { userId: auth.userId },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // ── Pull all bookings and reviews in parallel ──────────────────────────────
    const [bookings, reviews] = await Promise.all([
      prisma.booking.findMany({
        where: { providerId: profile.id },
        include: {
          customer: { select: { name: true } },
          package:  { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.findMany({
        where: { providerId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // ── Aggregate stats ────────────────────────────────────────────────────────
    const totalBookings    = bookings.length;
    const confirmedCount   = bookings.filter(b => ["CONFIRMED", "IN_ESCROW", "RELEASED"].includes(b.status)).length;
    const pendingCount     = bookings.filter(b => b.status === "PENDING").length;
    const cancelledCount   = bookings.filter(b => b.status === "CANCELLED").length;
    const releasedCount    = bookings.filter(b => b.status === "RELEASED").length;

    const totalRevenue     = bookings
      .filter(b => b.status === "RELEASED")
      .reduce((s, b) => s + Number(b.providerPayout || b.amount || 0), 0);

    const pendingRevenue   = bookings
      .filter(b => b.status === "IN_ESCROW")
      .reduce((s, b) => s + Number(b.providerPayout || b.amount || 0), 0);

    // Completion rate (released / total non-cancelled)
    const nonCancelledCount = bookings.filter(b => b.status !== "CANCELLED").length;
    const completionRate = nonCancelledCount > 0 ? Math.round((releasedCount / nonCancelledCount) * 100) : 0;

    // Average rating
    const avgRating = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: reviews.filter(r => r.rating === star).length,
    }));

    // Monthly revenue (last 6 months) — based on booking creation date for confirmed/released
    const monthlyRevenue: { month: string; amount: number; bookings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const monthBookings = bookings.filter(b => {
        const bd = new Date(b.createdAt);
        return bd.getFullYear() === d.getFullYear() && bd.getMonth() === d.getMonth()
          && ["CONFIRMED", "IN_ESCROW", "RELEASED"].includes(b.status);
      });
      monthlyRevenue.push({
        month: label,
        amount: monthBookings.reduce((s, b) => s + Number(b.providerPayout || b.amount || 0), 0),
        bookings: monthBookings.length,
      });
    }

    // Top customers
    const customerCount: Record<string, { name: string; count: number; spent: number }> = {};
    for (const b of bookings) {
      if (!b.customer) continue;
      const cid = b.customerId;
      if (!customerCount[cid]) customerCount[cid] = { name: b.customer.name, count: 0, spent: 0 };
      customerCount[cid].count++;
      customerCount[cid].spent += Number(b.amount || 0);
    }
    const topCustomers = Object.entries(customerCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([id, v]) => ({ id, ...v }));

    return NextResponse.json({
      stats: {
        totalBookings,
        confirmedCount,
        pendingCount,
        cancelledCount,
        releasedCount,
        completionRate,
        totalRevenue,
        pendingRevenue,
        avgRating: parseFloat(avgRating.toFixed(1)),
        reviewCount: reviews.length,
        responseTime: profile.responseTime || null,
      },
      monthlyRevenue,
      topCustomers,
      ratingBreakdown,
      recentReviews: reviews.slice(0, 3),
    });
  } catch (e) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    console.error("[insights/provider]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
