import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  console.log("Admin email:", admin?.email);
  if (admin) {
    console.log("Admin pass check admin123:", await bcrypt.compare("admin123", admin.password));
  }

  const provider = await prisma.user.findFirst({ where: { role: "PROVIDER" } });
  console.log("Provider email:", provider?.email);
  if (provider) {
    console.log("Provider pass check provider123:", await bcrypt.compare("provider123", provider.password));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
