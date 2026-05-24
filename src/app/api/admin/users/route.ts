import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, UnauthorizedError } from "@/lib/auth";

/**
 * GET  /api/admin/users          — list all users (paginated)
 * PATCH /api/admin/users         — update a user's role or verification
 */
export async function GET(req: NextRequest) {
  try {
    requireRole(req, "ADMIN");
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role   = searchParams.get("role")   || "";
    const page   = parseInt(searchParams.get("page") || "1");
    const take   = 20;
    const skip   = (page - 1) * take;

    const where = {
      ...(search ? {
        OR: [
          { name:  { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      } : {}),
      ...(role ? { role: role as never } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id:        true,
          name:      true,
          email:     true,
          role:      true,
          createdAt: true,
          provider:  { select: { businessName: true, isVerified: true, isSetupComplete: true } },
          _count:    { select: { bookingsAs: true, events: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pages: Math.ceil(total / take) });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
    console.error("[admin/users GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    requireRole(req, "ADMIN");
    const { userId, action, value } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action required." }, { status: 400 });
    }

    if (action === "setRole") {
      await prisma.user.update({ where: { id: userId }, data: { role: value as never } });
    } else if (action === "verifyProvider") {
      await prisma.providerProfile.update({ where: { userId }, data: { isVerified: Boolean(value) } });
    } else if (action === "suspend") {
      // Simple suspend: set a suspended flag via role (SUSPENDED pseudo-role) or delete session
      // For now just strip to CUSTOMER role as a soft action
      await prisma.user.update({ where: { id: userId }, data: { role: "CUSTOMER" as never } });
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
    console.error("[admin/users PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
