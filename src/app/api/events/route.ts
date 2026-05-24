import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const EventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  type: z.string().min(1, "Event type is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date").optional().nullable(),
  location: z.string().min(1, "Location is required"),
  guestCount: z.coerce.number().int().positive("Guest count must be positive"),
  budget: z.coerce.number().positive("Budget must be positive").optional().nullable(),
  vision: z.string().optional().nullable(),
  services: z.array(z.string()).optional(),
});

// GET /api/events — list current user's events
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const events = await prisma.event.findMany({
      where: { customerId: auth.userId },
      orderBy: { date: "asc" },
      include: {
        bookings: {
          include: {
            provider: { select: { id: true, businessName: true, location: true, userId: true } },
            package:  { select: { id: true, name: true, price: true, duration: true } },
            payment:  { select: { method: true, paidAt: true } },
          },
        },
      },
    });
    return NextResponse.json({ events });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/events — create new event
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const body = await req.json();
    const result = EventSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, type, date, endDate, location, guestCount, budget, vision, services } = result.data;

    const event = await prisma.event.create({
      data: {
        customerId: auth.userId,
        name,
        type,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        location,
        guestCount,
        budget: budget || null,
        vision: vision || null,
        services: services || [],
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[events POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
