import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/providers — public listing with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category   = searchParams.get("category");
    const categories = searchParams.get("categories"); // comma-separated for OR match
    const search     = searchParams.get("search") || "";
    const sort       = searchParams.get("sort") || "rating";
    const minBudget  = searchParams.get("minBudget");
    const maxBudget  = searchParams.get("maxBudget");
    const location   = searchParams.get("location") || "";
    const occasion   = searchParams.get("occasion") || "";

    const page  = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip  = (page - 1) * limit;

    const whereClause: any = {
      isVerified: true,
      ...(search ? {
        OR: [
          { businessName: { contains: search, mode: "insensitive" } },
          { bio: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
      ...(location ? {
        OR: [
          { location: { contains: location, mode: "insensitive" } },
          { addresses: { has: location } },
        ],
      } : {}),
      // Single category filter (browse page)
      ...(category && category !== "all" ? {
        services: {
          some: {
            category: category.toUpperCase() as never,
          },
        },
      } : {}),
      // Multi-category OR filter (match page) — takes precedence over single category
      ...(categories ? {
        services: {
          some: {
            category: {
              in: categories.split(",").map((c) => c.trim().toUpperCase()) as never[],
            },
          },
        },
      } : {}),
      ...(occasion && occasion !== "all" ? {
        services: {
          some: {
            tags: { has: occasion },
          },
        },
      } : {}),
    };

    const providers = await prisma.providerProfile.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        services: { include: { packages: true } },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true, bookings: true } },
        user: { select: { avatarUrl: true } },
      },
    });

    // Compute avg rating, min/max price, and sort
    const enriched = providers.map((p) => {
      const allPackages = p.services.flatMap((s) => s.packages);
      const prices = allPackages.map((pkg) => Number(pkg.price)).filter((n) => !isNaN(n));
      const minPrice = prices.length > 0 ? Math.min(...prices) : Infinity;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      return {
        ...p,
        avgRating: p.reviews.length
          ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
          : 0,
        reviewCount: p._count.reviews,
        completedEvents: p._count.bookings,
        minPrice,
        maxPrice,
      };
    });

    // Filter by budget range if specified
    let result = enriched;
    if (minBudget) {
      result = result.filter((p) => p.maxPrice >= Number(minBudget));
    }
    if (maxBudget) {
      result = result.filter((p) => p.minPrice <= Number(maxBudget));
    }

    result.sort((a, b) => {
      if (sort === "rating")      return b.avgRating - a.avgRating;
      if (sort === "reviews")     return b.reviewCount - a.reviewCount;
      if (sort === "price_asc")   return a.minPrice - b.minPrice;
      if (sort === "price_desc")  return b.minPrice - a.minPrice;
      if (sort === "newest")      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

    const total = await prisma.providerProfile.count({ where: whereClause });

    return NextResponse.json({ 
      providers: result,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } 
    });
  } catch (e) {
    console.error("[providers GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
