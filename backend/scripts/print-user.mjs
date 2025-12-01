import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const email = process.argv[2];
if (!email) { console.error('Usage: node scripts/print-user.mjs <email>'); process.exit(1); }
const run = async () => {
  await prisma.$connect();
  const u = await prisma.user.findUnique({ where: { email }, include: { role: true } });
  console.log(JSON.stringify(u, null, 2));
  await prisma.$disconnect();
};
run().catch(e => { console.error(e); process.exit(1); });
