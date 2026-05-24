import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.providerProfile.findFirst({
    where: { businessName: { contains: 'Frame', mode: 'insensitive' } },
    include: { user: { select: { email: true, name: true } } }
  });
  console.log("By business Frame:", JSON.stringify(result, null, 2));
}
main().finally(() => prisma.$disconnect());
