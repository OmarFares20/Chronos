import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ services: [] });

    const services = await prisma.service.findMany({
      where: { providerId: profile.id },
      include: { packages: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ services });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ services: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "PROVIDER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { category, name, description, tags, packages } = body;

    const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const service = await prisma.service.create({
      data: {
        providerId: profile.id,
        category: category.toUpperCase(),
        name,
        description,
        tags: tags || [],
        packages: {
          create: (packages || []).map((pkg: any) => ({
            name: pkg.name,
            description: pkg.description || null,
            price: parseFloat(pkg.price),
            duration: pkg.duration || null,
            features: pkg.features || [],
          })),
        },
      },
      include: { packages: true },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

