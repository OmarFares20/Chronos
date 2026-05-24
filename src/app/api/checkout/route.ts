import { NextRequest, NextResponse } from "next/server";
import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CartItemSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  packageId: z.string(),
  price: z.number().positive(),
  providerName: z.string(),
  packageName: z.string(),
  scheduledTime: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

const PlannerBodySchema = z.object({
  eventName: z.string().min(1, "Occasion name is required"),
  eventDate: z.string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date")
    .refine((val) => {
      const d = new Date(val);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return d >= today;
    }, "Occasion date cannot be in the past"),
  location: z.string().optional(),
  guestCount: z.number().int().positive().optional(),
  items: z.array(CartItemSchema).min(1, "Cart cannot be empty"),
});

const LegacyBodySchema = z.object({
  providerId: z.string(),
  eventId: z.string(),
  packageId: z.string(),
  eventDate: z.string().optional(),
  message: z.string().optional(),
});

type PlannerBody = z.infer<typeof PlannerBodySchema>;
type LegacyBody  = z.infer<typeof LegacyBodySchema>;

// ── POST /api/checkout ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const body = await req.json();

    // ── PLANNER FLOW (multi-item) ───────────────────────────────────────────
    if (Array.isArray(body.items)) {
      const parsed = PlannerBodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
      }
      return handlePlannerCheckout(auth.userId, parsed.data);
    }

    // ── LEGACY FLOW (single provider) ──────────────────────────────────────
    const parsed = LegacyBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing or invalid checkout fields." }, { status: 400 });
    }
    return handleLegacyCheckout(auth.userId, parsed.data);

  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    console.error("[checkout POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── Planner multi-item checkout (mock — no Stripe) ────────────────────────────

async function handlePlannerCheckout(customerId: string, body: PlannerBody) {
  const { eventName, eventDate, location, guestCount, items } = body;

  // Create or find the occasion record
  let event = await prisma.event.findFirst({
    where: { customerId, name: eventName, date: new Date(eventDate) },
  });
  if (!event) {
    event = await prisma.event.create({
      data: {
        customerId,
        name:       eventName,
        date:       new Date(eventDate),
        location:   location || "TBD",
        guestCount: guestCount || 1,
        status:     "PLANNING" as never,
        type:       "OTHER",
      },
    });
  }

  // Validate all packages exist and compute totals
  const packageIds = items.map(item => item.packageId);
  const packages = await prisma.package.findMany({
    where: { id: { in: packageIds } },
  });
  const packageMap = new Map(packages.map(p => [p.id, p]));

  const resolvedItems: Array<{
    item:           any;
    pkg:            { id: string; name: string; price: any };
    amount:         number;
    platformFee:    number;
    providerPayout: number;
  }> = [];

  for (const item of items) {
    const pkg = packageMap.get(item.packageId);
    if (!pkg) {
      return NextResponse.json({ error: `Package "${item.packageName}" not found.` }, { status: 404 });
    }
    const amount         = Number(pkg.price);
    const platformFee    = Math.round(amount * 0.05 * 100) / 100;
    const providerPayout = amount - platformFee;
    resolvedItems.push({ item, pkg, amount, platformFee, providerPayout });
  }

  // Create CONFIRMED bookings directly (mock payment — no Stripe)
  const bookings = await Promise.all(
    resolvedItems.map(({ item, amount, platformFee, providerPayout }) =>
      prisma.booking.create({
        data: {
          eventId:       event!.id,
          customerId,
          providerId:    item.providerId,
          packageId:     item.packageId,
          eventDate:     item.scheduledTime ? new Date(item.scheduledTime) : new Date(eventDate),
          message:       item.deliveryNotes || null,
          amount,
          platformFee,
          providerPayout,
          status:        "PENDING" as never,
        },
      })
    )
  );

  // Return booking results directly — frontend proceeds to confirmation step
  const results = bookings.map((b, i) => ({
    id:           b.id,
    providerName: resolvedItems[i].item.providerName,
    packageName:  resolvedItems[i].item.packageName,
    amount:       resolvedItems[i].amount,
  }));

  return NextResponse.json({ bookings: results }, { status: 200 });
}

// ── Legacy single-provider checkout (mock — no Stripe) ────────────────────────

async function handleLegacyCheckout(customerId: string, body: LegacyBody) {
  const { providerId, eventId, packageId, eventDate, message } = body;

  const event = await prisma.event.findFirst({ where: { id: eventId, customerId } });
  if (!event) {
    return NextResponse.json({ error: "Occasion not found." }, { status: 404 });
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) {
    return NextResponse.json({ error: "Package not found." }, { status: 404 });
  }

  const amount         = Number(pkg.price);
  const platformFee    = amount * 0.05;
  const providerPayout = amount - platformFee;

  const booking = await prisma.booking.create({
    data: {
      eventId,
      customerId,
      providerId,
      packageId,
      eventDate:     eventDate ? new Date(eventDate) : null,
      message:       message || null,
      amount,
      platformFee,
      providerPayout,
      status:        "PENDING" as never,
    },
  });

  return NextResponse.json({
    bookings: [{
      id:           booking.id,
      providerName: "Provider",
      packageName:  pkg.name,
      amount,
    }],
  }, { status: 200 });
}
