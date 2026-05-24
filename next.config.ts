import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// ── Content Security Policy ───────────────────────────────────────────────────
// Tightened per environment: dev allows 'unsafe-eval' for Next.js HMR
const csp = [
  `default-src 'self'`,
  `script-src 'self'${isDev ? " 'unsafe-eval' 'unsafe-inline'" : " 'unsafe-inline'"}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `img-src 'self' data: blob: https:`,
  `connect-src 'self' https://*.neon.tech wss://*.neon.tech https://api.stripe.com`,
  `frame-src https://js.stripe.com https://hooks.stripe.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
]
  .join("; ")
  .trim();

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options",           value: "DENY" },
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options",    value: "nosniff" },
  // Referrer policy
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  // Permissions policy — disable unneeded browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HSTS — only in production (breaks localhost otherwise)
  ...(!isDev
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
  // Content Security Policy
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  // ── Security headers on all routes ─────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // ── CORS headers for API routes ──────────────────────────────────────────
      {
        source: "/api/(.*)",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin",      value: "*" }, // Change to specific domain in production if needed
          { key: "Access-Control-Allow-Methods",     value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers",     value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
    ];
  },

  // ── Image optimization ──────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.neon.tech" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },

  // ── Compiler options ────────────────────────────────────────────────────────
  compiler: {
    // Remove console.log in production (keep console.error/warn)
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
};

export default nextConfig;
