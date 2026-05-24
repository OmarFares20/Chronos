import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, setAuthCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import "@/lib/env"; // startup validation

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = checkRateLimit(req, 5); // Max 5 login attempts per minute
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Find user — use dummy hash to prevent timing-based email enumeration
    const DUMMY_HASH = "$2b$12$invalidhashfortimingprotection000000000000000000000000";
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, password: true },
    });

    const storedHash = user ? user.password : DUMMY_HASH;
    const valid      = await bcrypt.compare(password, storedHash);

    if (!user || !valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Issue JWT using centralised helper
    const { password: _pw, ...safeUser } = user;
    const token = signToken({ userId: user.id, role: user.role as import("@/lib/auth").UserRole });

    const res = NextResponse.json({ user: safeUser });
    setAuthCookie(res, token);
    return res;

  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
