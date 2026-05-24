import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const UpdateDisputeSchema = z.object({
  status:        z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  adminResponse: z.string().max(2000).optional(),
});

// PATCH /api/disputes/[id] — admin updates status / response
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true },
    });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateDisputeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { status, adminResponse } = parsed.data;

    const dispute = await prisma.dispute.findUnique({ where: { id } });
    if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });

    const updated = await prisma.dispute.update({
      where: { id },
      data: {
        ...(status        ? { status: status as never } : {}),
        ...(adminResponse !== undefined ? { adminResponse } : {}),
        ...(status === "RESOLVED" || status === "CLOSED" ? { resolvedAt: new Date() } : {}),
      },
      include: {
        creator:     { select: { name: true, email: true } },
        attachments: true,
        booking:     { select: { id: true, amount: true, provider: { select: { businessName: true } } } },
      },
    });

    return NextResponse.json({ dispute: updated });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[disputes/:id PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/disputes/[id] — single dispute (own or admin)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true },
    });

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        creator:     { select: { name: true, email: true, role: true } },
        attachments: true,
        booking:     { select: { id: true, amount: true, provider: { select: { businessName: true } } } },
      },
    });

    if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });

    const isOwner = dispute.creatorId === auth.userId;
    const isAdmin = user?.role === "ADMIN";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ dispute });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
