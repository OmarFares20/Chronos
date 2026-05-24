import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "PROVIDER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service || service.providerId !== profile.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
