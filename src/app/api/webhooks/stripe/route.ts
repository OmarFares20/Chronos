import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const payload   = await req.text();
  const sig       = req.headers.get("stripe-signature");
  const secret    = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (!sig || !secret) {
      console.warn("⚠️  Missing Stripe signature or webhook secret.");
      return NextResponse.json({ error: "Configuration error" }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err: any) {
    console.error("[stripe webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Payment succeeded → move booking(s) to IN_ESCROW ─────────────────
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const meta    = session.metadata || {};

        if (meta.bookingId) {
          // Single booking (legacy flow)
          await prisma.booking.update({
            where: { id: meta.bookingId },
            data:  { status: "IN_ESCROW" as never, stripePaymentId: session.payment_intent },
          });
          console.log(`[webhook] Booking ${meta.bookingId} → IN_ESCROW`);
        } else if (meta.bookingIds) {
          // Multi-booking (planner cart flow)
          const ids: string[] = JSON.parse(meta.bookingIds);
          await prisma.booking.updateMany({
            where: { id: { in: ids } },
            data:  { status: "IN_ESCROW" as never, stripePaymentId: session.payment_intent },
          });
          console.log(`[webhook] Bookings [${ids.join(", ")}] → IN_ESCROW`);
        }
        break;
      }

      // ── Payment failed → restore booking(s) to PENDING ───────────────────
      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        const obj  = event.data.object as any;
        const meta = obj.metadata || {};
        if (meta.bookingId) {
          await prisma.booking.update({
            where: { id: meta.bookingId },
            data:  { status: "PENDING" as never },
          });
        } else if (meta.bookingIds) {
          const ids: string[] = JSON.parse(meta.bookingIds);
          await prisma.booking.updateMany({
            where: { id: { in: ids } },
            data:  { status: "PENDING" as never },
          });
        }
        break;
      }

      // ── Payment disputed → mark DISPUTED ─────────────────────────────────
      case "charge.dispute.created": {
        const dispute  = event.data.object as any;
        const piId     = dispute.payment_intent;
        if (piId) {
          await prisma.booking.updateMany({
            where: { stripePaymentId: piId },
            data:  { status: "DISPUTED" as never },
          });
          console.log(`[webhook] Payment ${piId} disputed → DISPUTED`);
        }
        break;
      }

      // ── Refund issued → mark REFUNDED ────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as any;
        const piId   = charge.payment_intent;
        if (piId) {
          await prisma.booking.updateMany({
            where: { stripePaymentId: piId },
            data:  { status: "REFUNDED" as never },
          });
          console.log(`[webhook] Payment ${piId} refunded → REFUNDED`);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] Handler error:", err);
    // Still return 200 so Stripe doesn't retry — we'll investigate via logs
  }

  return NextResponse.json({ received: true });
}
