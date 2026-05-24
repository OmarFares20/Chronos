import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.user.findFirst({
    where: { name: { contains: 'Aya', mode: 'insensitive' } },
    select: { email: true, name: true, role: true, provider: { select: { businessName: true } } }
  });
  console.log("By user name:", JSON.stringify(result, null, 2));

  const result2 = await prisma.providerProfile.findFirst({
    where: { businessName: { contains: 'Protection', mode: 'insensitive' } },
    include: { user: { select: { email: true, name: true } } }
  });
  console.log("By business Protection:", JSON.stringify(result2, null, 2));

  const result3 = await prisma.providerProfile.findMany({
    where: { businessName: { contains: 'Security', mode: 'insensitive' } },
    include: { user: { select: { email: true, name: true } } }
  });
  console.log("Security providers:", JSON.stringify(result3.map(r => ({ businessName: r.businessName, email: r.user.email })), null, 2));
}
main().finally(() => prisma.$disconnect());
