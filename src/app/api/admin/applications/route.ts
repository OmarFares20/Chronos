import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

// GET all applications
export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apps = await prisma.providerApplication.findMany({
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications: apps });
}

// PATCH to approve/reject
export async function PATCH(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status, reason } = await req.json();

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const application = await prisma.providerApplication.update({
    where: { id },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? reason : null,
    },
  });

  if (status === "APPROVED") {
    // Mark provider as verified
    await prisma.providerProfile.update({
      where: { userId: application.userId },
      data: { isVerified: true },
    });
  } else if (status === "REJECTED") {
    await prisma.providerProfile.update({
      where: { userId: application.userId },
      data: { isVerified: false },
    });
  }

  return NextResponse.json({ application });
}
