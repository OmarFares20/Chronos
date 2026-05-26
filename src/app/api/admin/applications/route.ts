import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { z } from "zod";

const PatchSchema = z.object({
  id:     z.string().cuid(),
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(500).optional(),
});

// GET all applications (admin only)
export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth || auth.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apps = await prisma.providerApplication.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications: apps });
}

// PATCH approve / reject (admin only)
export async function PATCH(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth || auth.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const { id, status, reason } = parsed.data;

  const application = await prisma.providerApplication.update({
    where: { id },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? (reason || null) : null,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  if (status === "APPROVED") {
    // Upsert provider profile — safe whether or not one already exists
    await prisma.providerProfile.upsert({
      where:  { userId: application.userId },
      update: { isVerified: true },
      create: {
        userId:       application.userId,
        businessName: application.user.name,
        bio:          "New verified provider on Chronos.",
        isVerified:   true,
        categories:   [],
        socialLinks:  null,
      },
    });
  }

  return NextResponse.json({ application });
}
