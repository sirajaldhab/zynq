import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    // Seed default roles and admin user
    const roleNames = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'HR_MANAGER', 'FINANCE_MANAGER', 'STAFF', 'EMPLOYEE'];
    const roles = await Promise.all(
      roleNames.map(async (name) =>
        this.role.upsert({ where: { name }, create: { name, permissionsJson: '{}' }, update: {} }),
      ),
    );
    // Normalize legacy statuses to new enum
    try {
      await this.$executeRawUnsafe(`UPDATE User SET status='PENDING_APPROVAL' WHERE status='PENDING'`);
      await this.$executeRawUnsafe(`UPDATE User SET status='ACTIVE' WHERE lower(status)='active'`);
      await this.$executeRawUnsafe(`UPDATE User SET status='INACTIVE' WHERE lower(status)='inactive'`);
      await this.$executeRawUnsafe(`UPDATE User SET status='REJECTED' WHERE lower(status)='rejected'`);
    } catch {}
    const adminRole = roles.find((r) => r.name === 'ADMIN');
    const adminEmail = 'admin@zynq.com';
    const existingAdmin = await this.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const passwordHash = await argon2.hash('Admin@siraj');
      await this.user.create({
        data: {
          email: adminEmail,
          name: 'Administrator',
          passwordHash,
          roleId: adminRole?.id,
          status: 'ACTIVE',
        } as any,
      });
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
