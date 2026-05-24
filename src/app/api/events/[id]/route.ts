import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (event.customerId !== auth.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Cancel event and cascade cancel all non-completed/escrowed bookings
    await prisma.event.update({ where: { id }, data: { status: "CANCELLED" } });
    await prisma.booking.updateMany({
      where: { eventId: id, status: { in: ["PENDING", "CONFIRMED"] } },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
