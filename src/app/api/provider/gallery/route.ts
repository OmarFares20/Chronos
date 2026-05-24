import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ items: [] });

    const items = await prisma.galleryItem.findMany({
      where: { providerId: profile.id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ items });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "PROVIDER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { imageUrl, label } = body;

    if (!imageUrl) return NextResponse.json({ error: "Image URL required." }, { status: 400 });

    const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const item = await prisma.galleryItem.create({
      data: {
        providerId: profile.id,
        imageUrl,
        label: label || null,
        sortOrder: 0,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "PROVIDER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Verify ownership
    const item = await prisma.galleryItem.findUnique({ where: { id } });
    if (!item || item.providerId !== profile.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.galleryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

