import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.vendor.findMany({ orderBy: { name: 'asc' } });
  }

  async get(id: string) {
    const v = await this.prisma.vendor.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Vendor not found');
    return v;
  }

  create(data: { name: string; contact?: string | null; bank_details_json?: any }) {
    return this.prisma.vendor.create({ data });
  }

  update(id: string, data: Partial<{ name: string; contact?: string | null; bank_details_json?: any }>) {
    return this.prisma.vendor.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.vendor.delete({ where: { id } });
  }
}
