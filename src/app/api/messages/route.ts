import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const MessageSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  content: z.string().min(1, "Message content cannot be empty"),
  bookingId: z.string().optional(),
});

// GET /api/messages?withUserId=xxx — fetch conversation
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const withUserId = req.nextUrl.searchParams.get("withUserId");

    const where = withUserId
      ? {
          OR: [
            { senderId: auth.userId, receiverId: withUserId },
            { senderId: withUserId, receiverId: auth.userId },
          ],
        }
      : {
          OR: [
            { senderId: auth.userId },
            { receiverId: auth.userId },
          ],
        };

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender:   { select: { id: true, name: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark as read
    if (withUserId) {
      await prisma.message.updateMany({
        where: { senderId: withUserId, receiverId: auth.userId, isRead: false },
        data:  { isRead: true },
      });
    }

    return NextResponse.json({ messages });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/messages — send message
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const body = await req.json();
    const result = MessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { receiverId, content, bookingId } = result.data;

    const message = await prisma.message.create({
      data: {
        senderId:   auth.userId,
        receiverId,
        content:    content.trim(),
        bookingId:  bookingId || null,
      },
      include: {
        sender:   { select: { id: true, name: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[messages POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
