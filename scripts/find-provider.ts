import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.providerProfile.findFirst({
    where: { businessName: { contains: 'Setups', mode: 'insensitive' } },
    include: { user: { select: { email: true, name: true } } }
  });
  console.log("By business Setups:", JSON.stringify(result, null, 2));

  const result2 = await prisma.providerProfile.findMany({
    where: { businessName: { contains: 'Pharaoh', mode: 'insensitive' } },
    include: { user: { select: { email: true, name: true } } }
  });
  console.log("All Pharaohs:", JSON.stringify(result2.map(r => ({ businessName: r.businessName, email: r.user.email })), null, 2));
}
main().finally(() => prisma.$disconnect());
