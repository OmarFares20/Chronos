/**
 * Environment variable validation.
 * Imported at the top of API routes and lib files that need specific vars.
 * Fails fast at startup if required variables are missing.
 *
 * Usage:
 *   import "@/lib/env";          // just validate
 *   import { env } from "@/lib/env"; // validate + get typed env
 */

interface Env {
  DATABASE_URL:        string;
  NEXTAUTH_SECRET:     string;
  NEXTAUTH_URL:        string;
  NODE_ENV:            "development" | "production" | "test";
  STRIPE_SECRET_KEY?:  string;
  STRIPE_WEBHOOK_SECRET?: string;
  JWT_EXPIRES_IN?:     string;
}

function validate(): Env {
  const required: Array<keyof Env> = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[Chronos] Missing required environment variables:\n  ${missing.join("\n  ")}\n` +
      `Copy .env.example to .env and fill in the missing values.`
    );
  }

  // Warn — non-fatal but important
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("[Chronos] ⚠️  STRIPE_SECRET_KEY is not set — payments will not work.");
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("[Chronos] ⚠️  STRIPE_WEBHOOK_SECRET is not set — webhooks will not be verified.");
  }
  if (process.env.NEXTAUTH_SECRET === "chronos-secret-change-in-production") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[Chronos] NEXTAUTH_SECRET must be changed from the default value in production.");
    }
    console.warn("[Chronos] ⚠️  NEXTAUTH_SECRET is using the insecure default. Change it before deploying.");
  }

  return {
    DATABASE_URL:          process.env.DATABASE_URL!,
    NEXTAUTH_SECRET:       process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL:          process.env.NEXTAUTH_URL!,
    NODE_ENV:              (process.env.NODE_ENV || "development") as Env["NODE_ENV"],
    STRIPE_SECRET_KEY:     process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    JWT_EXPIRES_IN:        process.env.JWT_EXPIRES_IN,
  };
}

// Run validation once at module load time
export const env = validate();
