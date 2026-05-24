import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/provider/availability — get blocked dates
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ error: "Not a provider." }, { status: 403 });

    const availability = await prisma.providerAvailability.findMany({
      where: { providerId: profile.id },
      orderBy: { date: "asc" },
    });
    return NextResponse.json({ availability });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/provider/availability — toggle block/unblock a date
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ error: "Not a provider." }, { status: 403 });

    const { date, note } = await req.json();
    if (!date) return NextResponse.json({ error: "date is required." }, { status: 400 });

    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);

    // Toggle: if already blocked, remove it
    const existing = await prisma.providerAvailability.findFirst({
      where: { providerId: profile.id, date: dateObj },
    });

    if (existing) {
      await prisma.providerAvailability.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: "unblocked" });
    } else {
      const entry = await prisma.providerAvailability.create({
        data: { providerId: profile.id, date: dateObj, isBlocked: true, note: note || null },
      });
      return NextResponse.json({ action: "blocked", entry }, { status: 201 });
    }
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[availability POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
