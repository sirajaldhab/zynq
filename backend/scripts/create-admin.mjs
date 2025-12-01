// Usage: node scripts/create-admin.mjs <email> <password> [name]
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const [,, emailArg, passwordArg, nameArg] = process.argv;
  if (!emailArg || !passwordArg) {
    console.error('Usage: node scripts/create-admin.mjs <email> <password> [name]');
    process.exit(1);
  }
  const email = String(emailArg).trim();
  const password = String(passwordArg);
  const name = (nameArg ? String(nameArg) : 'Administrator').trim();

  await prisma.$connect();
  try {
    // Ensure ADMIN role exists
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      create: { name: 'ADMIN', permissionsJson: '{}' },
      update: {},
    });

    const passwordHash = await argon2.hash(password);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { name, passwordHash, roleId: adminRole.id, status: 'ACTIVE' },
      });
      console.log(`Updated existing ADMIN user: ${email}`);
    } else {
      await prisma.user.create({
        data: { email, name, passwordHash, roleId: adminRole.id, status: 'ACTIVE' },
      });
      console.log(`Created ADMIN user: ${email}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
