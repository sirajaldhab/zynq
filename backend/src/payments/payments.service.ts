import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  list(invoiceId?: string) {
    return this.prisma.payment.findMany({
      where: { invoiceId: invoiceId || undefined },
      orderBy: { payment_date: 'desc' },
    });
  }

  async get(id: string) {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Payment not found');
    return p;
  }

  create(data: { invoiceId: string; amount: number; payment_date: Date; method?: string; reference?: string; created_by?: string }) {
    return this.prisma.payment.create({ data });
  }

  update(
    id: string,
    data: Partial<{ amount: number; payment_date: Date; method?: string; reference?: string; created_by?: string }>,
  ) {
    return this.prisma.payment.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.payment.delete({ where: { id } });
  }
}
