import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { isTyping } from "@/lib/typing-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/messages/stream
 *
 * Server-Sent Events endpoint for real-time message updates.
 * The client connects once and receives new-message events as they arrive.
 * Falls back gracefully to polling if SSE is unavailable.
 *
 * Query params:
 *   ?withUserId=<userId>   — conversation partner (optional)
 */
export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const withUserId = searchParams.get("withUserId");

  // Build the where clause
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

  // Track the latest message id we've seen so we only push deltas
  let lastCreatedAt = new Date();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send a heartbeat immediately to confirm connection
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ userId: auth.userId })}\n\n`)
      );

      // Poll DB every 2 seconds for new messages
      const interval = setInterval(async () => {
        try {
          const messages = await prisma.message.findMany({
            where: {
              ...where,
              createdAt: { gt: lastCreatedAt },
            },
            include: {
              sender:   { select: { id: true, name: true } },
              receiver: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "asc" },
          });

          if (messages.length > 0) {
            lastCreatedAt = messages[messages.length - 1].createdAt;

            // Mark incoming messages as read
            const incomingIds = messages
              .filter((m) => m.receiverId === auth.userId && !m.isRead)
              .map((m) => m.id);

            if (incomingIds.length > 0) {
              await prisma.message.updateMany({
                where: { id: { in: incomingIds } },
                data:  { isRead: true },
              });
            }

            controller.enqueue(
              encoder.encode(
                `event: messages\ndata: ${JSON.stringify({ messages })}\n\n`
              )
            );
          } else {
            // Check typing status
            let partnerTyping = false;
            if (withUserId) {
              partnerTyping = isTyping(withUserId, auth.userId);
            }
            
            if (partnerTyping) {
              controller.enqueue(encoder.encode(`event: typing\ndata: ${JSON.stringify({ userId: withUserId })}\n\n`));
            } else {
              // Heartbeat every 2s to keep the connection alive
              controller.enqueue(encoder.encode(`: heartbeat\n\n`));
            }
          }
        } catch {
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: "DB error" })}\n\n`)
          );
        }
      }, 2000);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
}
