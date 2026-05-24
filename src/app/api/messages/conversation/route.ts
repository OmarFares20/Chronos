import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * POST /api/messages/conversation
 * Body: { providerId: string }
 *
 * Looks up the provider's userId so the caller can open/create a conversation.
 * Returns { userId, name } — the User ID of the provider's account.
 * A first "hello" message is created if no conversation exists yet,
 * so the thread immediately appears in both inboxes.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { providerId } = await req.json();

    if (!providerId) {
      return NextResponse.json({ error: "providerId is required" }, { status: 400 });
    }

    // Resolve the provider's user account
    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      select: { userId: true, businessName: true },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const providerUserId = provider.userId;

    // Guard: can't message yourself
    if (providerUserId === auth.userId) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    // Check if a conversation already exists (any message between the two)
    const existing = await prisma.message.findFirst({
      where: {
        OR: [
          { senderId: auth.userId, receiverId: providerUserId },
          { senderId: providerUserId, receiverId: auth.userId },
        ],
      },
    });

    // If no messages exist yet, seed the conversation with a greeting
    if (!existing) {
      const customer = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { name: true },
      });

      await prisma.message.create({
        data: {
          senderId:   auth.userId,
          receiverId: providerUserId,
          content:    `Hi ${provider.businessName}! I'd like to learn more about your services.`,
        },
      });

      // Notify the provider
      await prisma.notification.create({
        data: {
          userId:  providerUserId,
          type:    "MESSAGE",
          title:   "New Message",
          message: `${customer?.name || "A customer"} sent you a message.`,
        },
      }).catch(() => {}); // non-fatal
    }

    return NextResponse.json({
      userId:       providerUserId,
      businessName: provider.businessName,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[messages/conversation POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
