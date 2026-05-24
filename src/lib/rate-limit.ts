import { LRUCache } from "lru-cache";
import { NextRequest, NextResponse } from "next/server";

const rateLimitCache = new LRUCache<string, number>({
  max: 500, // max 500 IPs stored
  ttl: 60 * 1000, // 1 minute
});

export function checkRateLimit(req: NextRequest, limit: number = 5): NextResponse | null {
  // Use IP address from headers, fallback to "unknown"
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const currentUsage = rateLimitCache.get(ip) || 0;

  if (currentUsage >= limit) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  rateLimitCache.set(ip, currentUsage + 1);
  return null;
}
