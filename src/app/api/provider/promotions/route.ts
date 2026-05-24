import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/provider/promotions — list own promotions
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ error: "Not a provider." }, { status: 403 });

    const promotions = await prisma.promotion.findMany({
      where: { providerId: profile.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ promotions });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/provider/promotions — create promotion
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ error: "Not a provider." }, { status: 403 });

    const { title, type, value, code, minAmount, expiresAt, maxUsage } = await req.json();
    if (!title || !type || value === undefined) {
      return NextResponse.json({ error: "title, type, and value are required." }, { status: 400 });
    }

    const promotion = await prisma.promotion.create({
      data: {
        providerId: profile.id,
        title,
        type,
        value,
        code:      code     || null,
        minAmount: minAmount || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUsage:  maxUsage  || null,
      },
    });
    return NextResponse.json({ promotion }, { status: 201 });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[promotions POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/provider/promotions?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });

    const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ error: "Not a provider." }, { status: 403 });

    await prisma.promotion.deleteMany({ where: { id, providerId: profile.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
