import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// ── Single source of truth for the JWT secret ─────────────────────────────────
// All route files must import this — never re-declare locally.
// Startup validation in lib/env.ts ensures NEXTAUTH_SECRET is set.
export const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

// ── Types ─────────────────────────────────────────────────────────────────────
export type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";

export interface AuthPayload {
  userId: string;
  role:   UserRole;
  name?:  string;
  email?: string;
}

// ── Custom errors ─────────────────────────────────────────────────────────────

/** Thrown by requireAuth / requireRole when the request is unauthenticated or unauthorised. */
export class UnauthorizedError extends Error {
  readonly statusCode: number;
  constructor(message = "Unauthorized", statusCode = 401) {
    super(message);
    this.name       = "UnauthorizedError";
    this.statusCode = statusCode;
  }
}

// ── Response helpers ──────────────────────────────────────────────────────────

/** Returns a JSON 401/403 response — convenience wrapper to reduce boilerplate. */
export function unauthorizedResponse(message = "Unauthorized", statusCode = 401) {
  return NextResponse.json({ error: message }, { status: statusCode });
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

/** Reads and verifies the JWT cookie; returns null on failure. */
export function getAuth(req: NextRequest): AuthPayload | null {
  try {
    const token = req.cookies.get("chronos_token")?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

/** Like getAuth but throws UnauthorizedError instead of returning null. */
export function requireAuth(req: NextRequest): AuthPayload {
  const auth = getAuth(req);
  if (!auth) throw new UnauthorizedError("Authentication required.", 401);
  return auth;
}

/** Requires a specific role. Throws 403 if role doesn't match. */
export function requireRole(req: NextRequest, role: UserRole): AuthPayload {
  const auth = requireAuth(req);
  if (auth.role !== role) {
    throw new UnauthorizedError(`Forbidden: ${role} role required.`, 403);
  }
  return auth;
}

/** Requires any of the given roles. Throws 403 if none match. */
export function requireAnyRole(req: NextRequest, ...roles: UserRole[]): AuthPayload {
  const auth = requireAuth(req);
  if (!roles.includes(auth.role)) {
    throw new UnauthorizedError(`Forbidden: one of [${roles.join(", ")}] role required.`, 403);
  }
  return auth;
}

// ── Route wrapper ─────────────────────────────────────────────────────────────

/**
 * Wraps an API route handler in standard auth-error handling.
 * Catches UnauthorizedError and returns the correct HTTP status automatically.
 */
export function withAuth<T extends unknown[]>(
  handler: (auth: AuthPayload, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const auth = requireAuth(req);
      return await handler(auth, ...args);
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        return unauthorizedResponse(e.message, e.statusCode);
      }
      console.error("[withAuth unhandled error]", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

// ── JWT issuance helper ───────────────────────────────────────────────────────

/** Issues a signed JWT for the given user payload. */
export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any,
  });
}

/** Sets the auth cookie on a NextResponse. */
export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set("chronos_token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 7, // 7 days
    path:     "/",
  });
}
