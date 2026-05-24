import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const start = Date.now();
  let dbStatus = "disconnected";
  let dbLatency = -1;

  try {
    // Ping the database to check connection and measure latency
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - start;
    dbStatus = "connected";
  } catch (error) {
    console.error("[health GET] Database ping failed:", error);
  }

  const uptime = process.uptime();

  const isHealthy = dbStatus === "connected";
  
  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)}s`,
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
