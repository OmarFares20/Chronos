import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, UnauthorizedError } from "@/lib/auth";

/**
 * GET /api/admin/stats
 * Returns platform-wide statistics for the admin dashboard.
 * Requires ADMIN role.
 */
export async function GET(req: NextRequest) {
  try {
    requireRole(req, "ADMIN");

    const [
      totalUsers,
      totalProviders,
      totalCustomers,
      totalBookings,
      pendingBookings,
      escrowBookings,
      disputedBookings,
      totalEvents,
      totalMessages,
      recentUsers,
      recentBookings,
      topProviders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "PROVIDER" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "IN_ESCROW" } }),
      prisma.booking.count({ where: { status: "DISPUTED" } }),
      prisma.event.count(),
      prisma.message.count(),
      // Most recent 8 users
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      // Most recent 6 bookings with relations
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          customer: { select: { name: true } },
          provider: { select: { businessName: true } },
          package:  { select: { name: true } },
        },
      }),
      // Top 5 providers by review count
      prisma.providerProfile.findMany({
        take: 5,
        include: {
          _count: { select: { reviews: true, bookings: true } },
          reviews: { select: { rating: true } },
        },
        orderBy: { reviews: { _count: "desc" } },
      }),
    ]);

    // Compute revenue
    const revenueData = await prisma.booking.aggregate({
      _sum: { platformFee: true, amount: true },
    });

    const platformRevenue = Number(revenueData._sum.platformFee || 0);
    const totalVolume     = Number(revenueData._sum.amount || 0);

    const enrichedProviders = topProviders.map((p) => ({
      id:            p.id,
      businessName:  p.businessName,
      location:      p.location,
      reviewCount:   p._count.reviews,
      bookingCount:  p._count.bookings,
      avgRating:     p.reviews.length
        ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
        : 0,
    }));

    return NextResponse.json({
      stats: {
        totalUsers,
        totalProviders,
        totalCustomers,
        totalBookings,
        pendingBookings,
        escrowBookings,
        disputedBookings,
        totalEvents,
        totalMessages,
        platformRevenue,
        totalVolume,
      },
      recentUsers,
      recentBookings,
      topProviders: enrichedProviders,
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    console.error("[admin/stats GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
