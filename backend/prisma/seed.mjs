import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: 'SUPER_ADMIN' },
    { name: 'ADMIN' },
    { name: 'MANAGER' },
    { name: 'ACCOUNTANT' },
    { name: 'STAFF' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name, permissionsJson: '{}' },
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@zynq.app';
  const adminPass = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!1234';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const role = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    const passwordHash = await argon2.hash(adminPass);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        passwordHash,
        status: 'ACTIVE',
        roleId: role.id,
      },
    });
    console.log(`[seed] Created admin user ${adminEmail} with password: ${adminPass}`);
  } else {
    console.log('[seed] Admin user exists');
  }
}

main().catch((e) => {
  console.error('[seed] Error', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
