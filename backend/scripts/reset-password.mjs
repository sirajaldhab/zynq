import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();
const [,, emailArg, passwordArg] = process.argv;
if (!emailArg || !passwordArg) {
  console.error('Usage: node scripts/reset-password.mjs <email> <newPassword>');
  process.exit(1);
}

async function main(){
  await prisma.$connect();
  const email = String(emailArg).trim();
  const passwordHash = await argon2.hash(String(passwordArg));
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('User not found:', email);
    process.exit(2);
  }
  await prisma.user.update({ where: { email }, data: { passwordHash, status: 'ACTIVE' } });
  console.log('Password reset for', email);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
