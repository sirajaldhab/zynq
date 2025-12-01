import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const keepEmails = new Set([
    'admin@zynq.com',
    'admin@zynq.app',
  ]);
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const where = adminRole
    ? { NOT: [{ roleId: adminRole.id }], email: { notIn: Array.from(keepEmails) } }
    : { email: { notIn: Array.from(keepEmails) } };
  const result = await prisma.user.deleteMany({ where });
  console.log(`[wipe-users] Deleted ${result.count} users (preserved admins and keep list).`);
}

main().catch((e) => {
  console.error('[wipe-users] Error', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
