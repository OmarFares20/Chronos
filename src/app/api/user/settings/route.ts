import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

const accountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional().transform(val => {
    if (!val) return val;
    const cleaned = val.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      return `+20${cleaned.substring(1)}`;
    }
    if (cleaned.match(/^\d{10}$/)) {
      return `+20${cleaned}`;
    }
    return cleaned;
  }),
  avatarUrl: z.string().optional().or(z.literal("")),
});

const securitySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const providerSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  bio: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  addresses: z.array(z.string()).optional(),
  socialLinks: z.string().optional(),
  galleryUrls: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const body = await req.json();
    const { action } = body;

    if (action === "account") {
      const parsed = accountSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
      }
      
      const { name, email, phone, avatarUrl } = parsed.data;
      
      if (email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.id !== auth.userId) {
          return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
        }
      }

      const user = await prisma.user.update({
        where: { id: auth.userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(phone !== undefined && { phone }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
        select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
      });
      return NextResponse.json({ user });
    }

    if (action === "security") {
      const parsed = securitySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
      }
      
      const { currentPassword, newPassword } = parsed.data;
      
      const user = await prisma.user.findUnique({ where: { id: auth.userId } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: auth.userId },
        data: { password: hashed },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "provider") {
      if (auth.role !== "PROVIDER") {
        return NextResponse.json({ error: "Only providers can update this profile" }, { status: 403 });
      }
      
      const parsed = providerSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
      }

      const { businessName, bio, location, addresses, socialLinks, galleryUrls } = parsed.data;
      
      const profile = await prisma.providerProfile.update({
        where: { userId: auth.userId },
        data: {
          businessName,
          ...(bio !== undefined && { bio }),
          ...(location !== undefined && { location }),
          ...(addresses !== undefined && { addresses }),
          ...(socialLinks !== undefined && { socialLinks }),
          ...(galleryUrls && galleryUrls.length > 0 && {
            galleryItems: {
              create: galleryUrls.map((url: string) => ({
                imageUrl: url,
                label: "Gallery Image",
                aspect: "landscape"
              }))
            }
          })
        },
      });
      
      return NextResponse.json({ profile });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[settings API]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Keep PUT for backwards compatibility for any other old clients
export async function PUT(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const body = await req.json();
    // Default backward compatible logic
    if (body.currentPassword && body.newPassword) {
      body.action = "security";
    } else {
      body.action = "account";
    }
    // We can't easily re-assign the req body and call PATCH directly without a new request object,
    // but we can just invoke the same logic:
    const newReq = new Request(req.url, {
      method: "PATCH",
      headers: req.headers,
      body: JSON.stringify(body),
    });
    return PATCH(newReq as NextRequest);
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
