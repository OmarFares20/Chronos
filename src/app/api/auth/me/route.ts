import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = checkRateLimit(req, 30); // Higher limit (30/min) for auth checks
    if (rateLimitResponse) return rateLimitResponse;

    const auth = getAuth(req);
    if (!auth) return NextResponse.json({ user: null }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        phone: true,
        role: true, 
        avatarUrl: true,
        provider: { 
          select: { 
            isVerified: true,
            businessName: true,
            bio: true,
            location: true,
            addresses: true,
            socialLinks: true,
          } 
        }
      },
    });

    if (!user) return NextResponse.json({ user: null }, { status: 401 });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
