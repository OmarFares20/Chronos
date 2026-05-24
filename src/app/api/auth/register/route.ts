import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, setAuthCookie, type UserRole } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import "@/lib/env";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = checkRateLimit(req, 5); // Max 5 registration attempts per minute
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await req.formData();
    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const role = formData.get("role")?.toString();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 12);

    const phone = formData.get("phone")?.toString() || null;
    const address = formData.get("address")?.toString() || null;

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: role as UserRole,
        phone,
        address,
      },
    });

    if (role === "PROVIDER") {
      const categories = formData.getAll("categories").map(String);
      const addresses = formData.getAll("addresses").map(String);
      const commercialRegister = formData.get("commercialRegister") as File | null;
      const taxCard = formData.get("taxCard") as File | null;
      const idCard = formData.get("idCard") as File | null;

      if (!commercialRegister || !taxCard || !idCard) {
        // Rollback user if documents missing
        await prisma.user.delete({ where: { id: user.id } });
        return NextResponse.json({ error: "Missing required legal documents." }, { status: 400 });
      }

      // Ensure upload dir exists
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Save files
      const saveFile = async (file: File, prefix: string) => {
        const ext = path.extname(file.name) || ".pdf";
        const filename = `${prefix}-${user.id}-${Date.now()}${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(path.join(uploadDir, filename), buffer);
        return `/uploads/${filename}`;
      };

      const [crPath, tcPath, idPath] = await Promise.all([
        saveFile(commercialRegister, "cr"),
        saveFile(taxCard, "tax"),
        saveFile(idCard, "id"),
      ]);

      // Create ProviderProfile
      await prisma.providerProfile.create({
        data: {
          userId: user.id,
          businessName: name,
          categories: categories as any[],
          addresses: addresses,
          isSetupComplete: false,
          isVerified: false,
        },
      });

      // Create ProviderApplication
      await prisma.providerApplication.create({
        data: {
          userId: user.id,
          status: "PENDING",
          commercialRegister: crPath,
          taxCard: tcPath,
          idCard: idPath,
        },
      });
    }

    const token = signToken({ userId: user.id, role: user.role as UserRole });
    const res = NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } }, { status: 201 });
    setAuthCookie(res, token);
    return res;

  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
