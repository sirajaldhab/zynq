import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  list() {
    return this.prisma.vendor.findMany({ orderBy: { name: 'asc' } });
  }

  async get(id: string) {
    const v = await this.prisma.vendor.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Vendor not found');
    return v;
  }

  async create(
    data: { name: string; contact?: string | null; bank_details_json?: any },
    user?: { id?: string; name?: string; email?: string },
  ) {
    const vendor = await this.prisma.vendor.upsert({
      where: { name: data.name },
      update: { contact: data.contact ?? undefined, bank_details_json: data.bank_details_json ?? undefined },
      create: data,
    });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'Vendor',
        entityId: vendor.id,
        entityName: vendor.name,
        extra: {
          contact: vendor.contact,
        },
      })
      .catch(() => {});

    return vendor;
  }

  async update(
    id: string,
    data: Partial<{ name: string; contact?: string | null; bank_details_json?: any }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    const vendor = await this.prisma.vendor.update({ where: { id }, data });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'updated',
        entityType: 'Vendor',
        entityId: vendor.id,
        entityName: vendor.name,
        extra: {
          contact: vendor.contact,
        },
      })
      .catch(() => {});

    return vendor;
  }

  async delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    const vendor = await this.prisma.vendor.delete({ where: { id } });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'deleted',
        entityType: 'Vendor',
        entityId: vendor.id,
        entityName: vendor.name,
        extra: {
          contact: vendor.contact,
        },
      })
      .catch(() => {});

    return vendor;
  }
}
