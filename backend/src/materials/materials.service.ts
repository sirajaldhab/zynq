import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  list(projectId?: string) {
    return this.prisma.material.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { invoice_date: 'desc' },
    });
  }

  async get(id: string) {
    const m = await this.prisma.material.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Material not found');
    return m;
  }

  create(data: {
    projectId: string;
    invoice_date?: Date | null;
    vendorId?: string | null;
    item_description: string;
    quantity: number;
    unit_price?: number | null;
    total: number;
    attachments?: any;
  }) {
    return this.prisma.material.create({ data });
  }

  update(
    id: string,
    data: Partial<{
      invoice_date?: Date | null;
      vendorId?: string | null;
      item_description: string;
      quantity: number;
      unit_price?: number | null;
      total: number;
      attachments?: any;
    }>,
  ) {
    return this.prisma.material.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.material.delete({ where: { id } });
  }
}
