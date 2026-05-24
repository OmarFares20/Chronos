import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { z } from "zod";

const ProfileUpdateSchema = z.object({
  businessName:  z.string().min(2, "Business name must be at least 2 characters").optional(),
  bio:           z.string().optional(),
  location:      z.string().optional(),
  responseTime:  z.string().optional(),
  since:         z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional(),
  avatarUrl:     z.string().min(1).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "PROVIDER")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const profile = await prisma.providerProfile.findUnique({
      where:   { userId: auth.userId },
      include: { services: { include: { packages: true } }, galleryItems: true },
    });

    return NextResponse.json({ profile });
  } catch (e: unknown) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "PROVIDER")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const result = ProfileUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    const { businessName, bio, location, responseTime, since, avatarUrl } = result.data;

    const profile = await prisma.providerProfile.update({
      where: { userId: auth.userId },
      data: {
        ...(businessName               && { businessName }),
        ...(bio !== undefined          && { bio }),
        ...(location !== undefined     && { location }),
        ...(responseTime !== undefined && { responseTime }),
        ...(since !== undefined        && { since }),
        ...(avatarUrl !== undefined    && { avatarUrl }),
        // SECURITY FIX (SA8): isVerified removed — must be set by an admin-only endpoint
      },
      include: { services: { include: { packages: true } }, galleryItems: true },
    });

    return NextResponse.json({ profile });
  } catch (e: unknown) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    console.error("[provider/profile PUT]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
