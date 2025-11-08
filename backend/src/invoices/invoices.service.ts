import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  list(projectId?: string, clientId?: string) {
    return this.prisma.invoice.findMany({
      where: {
        projectId: projectId || undefined,
        clientId: clientId || undefined,
      },
      orderBy: { invoice_date: 'desc' },
    });
  }

  async get(id: string) {
    const inv = await this.prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  create(data: {
    projectId: string;
    clientId: string;
    invoice_date: Date;
    due_date?: Date;
    items_json: any;
    subtotal: number;
    vat: number;
    total: number;
    status?: string;
  }) {
    const toCreate: any = { ...data };
    if (typeof toCreate.items_json !== 'string') {
      toCreate.items_json = JSON.stringify(toCreate.items_json ?? {});
    }
    return this.prisma.invoice.create({ data: toCreate });
  }

  update(
    id: string,
    data: Partial<{
      invoice_date: Date;
      due_date?: Date;
      items_json: any;
      subtotal: number;
      vat: number;
      total: number;
      status?: string;
    }>,
  ) {
    const toUpdate: any = { ...data };
    if (toUpdate.items_json && typeof toUpdate.items_json !== 'string') {
      toUpdate.items_json = JSON.stringify(toUpdate.items_json);
    }
    return this.prisma.invoice.update({ where: { id }, data: toUpdate });
  }

  delete(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }

  totals(projectId?: string) {
    return this.prisma.invoice.aggregate({
      _sum: { subtotal: true, vat: true, total: true },
      where: { projectId: projectId || undefined },
    });
  }
}
