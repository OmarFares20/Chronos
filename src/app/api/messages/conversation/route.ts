import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, UnauthorizedError } from "@/lib/auth";

/**
 * POST /api/messages/conversation
 * Body: { providerId?: string, targetUserId?: string, initialMessage?: string }
 *
 * Opens or creates a conversation between the caller and a target user.
 * - If `providerId` is given: resolves the provider's userId first.
 * - If `targetUserId` is given directly (e.g. admin messaging a dispute filer): uses it as-is.
 * Returns { userId, name }.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const body = await req.json();
    const { providerId, targetUserId: directTargetId, initialMessage } = body;

    let targetUserId: string;
    let targetName: string;

    if (directTargetId) {
      // Direct user-to-user (admin → filer, etc.)
      const targetUser = await prisma.user.findUnique({
        where: { id: directTargetId },
        select: { id: true, name: true },
      });
      if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
      targetUserId = targetUser.id;
      targetName   = targetUser.name;
    } else if (providerId) {
      // Customer → provider flow
      const provider = await prisma.providerProfile.findUnique({
        where: { id: providerId },
        select: { userId: true, businessName: true },
      });
      if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      targetUserId = provider.userId;
      targetName   = provider.businessName;
    } else {
      return NextResponse.json({ error: "providerId or targetUserId is required" }, { status: 400 });
    }

    // Guard: can't message yourself
    if (targetUserId === auth.userId) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    // Check if conversation already exists
    const existing = await prisma.message.findFirst({
      where: {
        OR: [
          { senderId: auth.userId,   receiverId: targetUserId },
          { senderId: targetUserId,  receiverId: auth.userId  },
        ],
      },
    });

    // Seed first message if new conversation
    if (!existing) {
      const sender = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { name: true },
      });

      const content = initialMessage?.trim() ||
        `Hi ${targetName}! I'd like to get in touch.`;

      await prisma.message.create({
        data: {
          senderId:   auth.userId,
          receiverId: targetUserId,
          content,
        },
      });
    }

    return NextResponse.json({ userId: targetUserId, name: targetName });
  } catch (e: unknown) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[messages/conversation POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
