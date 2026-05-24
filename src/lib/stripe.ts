import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  console.warn("⚠️ STRIPE_SECRET_KEY is missing. Stripe payments will not work.");
}

export const stripe = new Stripe(stripeSecret || "dummy_key", {
  apiVersion: "2024-06-20", // using a stable version
  appInfo: {
    name: "Chronos Marketplace",
    version: "0.1.0",
  },
});
