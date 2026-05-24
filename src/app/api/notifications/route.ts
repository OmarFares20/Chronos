import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { BookingStatus } from "@prisma/client";

// GET /api/notifications — aggregated notifications for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);

    const notifications: {
      id: string;
      type: "message" | "booking" | "review" | "system";
      title: string;
      body: string;
      href: string;
      createdAt: string;
      isRead: boolean;
    }[] = [];

    // ── 1. Unread messages ────────────────────────────────────────────────
    const unreadMsgs = await prisma.message.findMany({
      where: { receiverId: auth.userId, isRead: false },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    for (const m of unreadMsgs) {
      notifications.push({
        id:        `msg-${m.id}`,
        type:      "message",
        title:     `New message from ${m.sender?.name ?? "someone"}`,
        body:      m.content.length > 80 ? m.content.slice(0, 80) + "…" : m.content,
        href:      "/dashboard/messages",
        createdAt: m.createdAt.toISOString(),
        isRead:    false,
      });
    }

    // ── 2. Booking status changes (last 7 days) ───────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000);

    if (auth.role === "PROVIDER") {
      // Provider: new PENDING bookings
      const pendingBookings = await prisma.booking.findMany({
        where: {
          provider: { userId: auth.userId },
          status: "PENDING",
          createdAt: { gte: sevenDaysAgo },
        },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      for (const b of pendingBookings) {
        notifications.push({
          id:        `booking-${b.id}`,
          type:      "booking",
          title:     "New booking request",
          body:      `${b.customer?.name ?? "A customer"} requested a booking for ${b.occasionLabel ?? "an occasion"}`,
          href:      "/dashboard/provider/bookings",
          createdAt: b.createdAt.toISOString(),
          isRead:    b.status !== "PENDING",
        });
      }
    } else {
      // Customer: booking status changes (CONFIRMED / CANCELLED)
      const updatedBookings = await prisma.booking.findMany({
        where: {
          customerId: auth.userId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.RELEASED] },
          updatedAt: { gte: sevenDaysAgo },
        },
        include: { provider: { select: { businessName: true } } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      });
      for (const b of updatedBookings) {
        const s = b.status;
        const statusLabel = s === BookingStatus.CONFIRMED ? "confirmed"
          : s === BookingStatus.CANCELLED ? "cancelled"
          : s === BookingStatus.RELEASED  ? "completed & payment released"
          : "updated";
        notifications.push({
          id:        `booking-${b.id}`,
          type:      "booking",
          title:     `Booking ${statusLabel}`,
          body:      `Your booking with ${b.provider?.businessName ?? "provider"} was ${statusLabel}`,
          href:      "/dashboard/bookings",
          createdAt: b.updatedAt.toISOString(),
          isRead:    s === BookingStatus.RELEASED,
        });
      }
    }

    // Sort by newest first
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[notifications GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/notifications/read — mark unread messages as read (side-effect)
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    // Mark all messages as read for this user
    await prisma.message.updateMany({
      where: { receiverId: auth.userId, isRead: false },
      data:  { isRead: true },
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
