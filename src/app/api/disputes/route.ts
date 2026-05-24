import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const CreateDisputeSchema = z.object({
  title:       z.string().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().min(20, "Please describe the issue in more detail").max(2000),
  bookingId:   z.string().cuid().optional().nullable(),
  attachments: z.array(z.object({
    filePath: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
  })).max(5).optional(),
});

// POST /api/disputes — create a dispute
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const body = await req.json();

    const parsed = CreateDisputeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { title, description, bookingId, attachments } = parsed.data;

    // Determine creator role
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const creatorRole = user.role === "PROVIDER" ? "PROVIDER" : "CUSTOMER";

    // If bookingId provided, verify the user is party to it
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { provider: { select: { userId: true } } },
      });
      if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      const isParty = booking.customerId === auth.userId || booking.provider.userId === auth.userId;
      if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dispute = await prisma.dispute.create({
      data: {
        title,
        description,
        creatorId:   auth.userId,
        creatorRole: creatorRole as never,
        bookingId:   bookingId || null,
        attachments: attachments?.length
          ? { create: attachments.map((a) => ({ filePath: a.filePath, fileName: a.fileName, fileSize: a.fileSize })) }
          : undefined,
      },
      include: { attachments: true, booking: { select: { id: true } } },
    });

    return NextResponse.json({ dispute }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[disputes POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/disputes — list disputes (own for users, all for admin)
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const role   = searchParams.get("role")   || undefined;

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isAdmin = user.role === "ADMIN";

    const where: Record<string, unknown> = {};
    if (!isAdmin) where.creatorId = auth.userId;
    if (status)   where.status    = status;
    if (role && isAdmin) where.creatorRole = role;

    const disputes = await prisma.dispute.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        creator:     { select: { name: true, email: true, role: true } },
        attachments: true,
        booking:     { select: { id: true, amount: true, provider: { select: { businessName: true } } } },
      },
    });

    return NextResponse.json({ disputes });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[disputes GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
