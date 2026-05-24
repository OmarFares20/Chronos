import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const provider = await prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, avatarUrl: true, createdAt: true } },
        services: { include: { packages: true } },
        reviews: {
          include: { customer: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        galleryItems: { orderBy: { sortOrder: "asc" } },
        _count: { select: { bookings: true } },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found." }, { status: 404 });
    }

    const avgRating = provider.reviews.length
      ? provider.reviews.reduce((s, r) => s + r.rating, 0) / provider.reviews.length
      : 0;

    return NextResponse.json({
      provider: {
        ...provider,
        // avatarUrl from ProviderProfile takes precedence over user.avatarUrl
        avatarUrl: provider.avatarUrl || provider.user?.avatarUrl || null,
        avgRating,
      },
    });
  } catch (e) {
    console.error("[providers/:id GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
