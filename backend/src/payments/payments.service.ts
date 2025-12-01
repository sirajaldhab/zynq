import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async list(params: { invoiceId?: string; expenseId?: string; projectId?: string; dateFrom?: Date; dateTo?: Date; method?: string; search?: string; page: number; pageSize: number; sortKey?: string; sortDir?: 'asc' | 'desc' }) {
    const where: any = {
      invoiceId: params.invoiceId || undefined,
      expenseId: params.expenseId || undefined,
      projectId: params.projectId || undefined,
      AND: [],
    };
    if (params.dateFrom) (where.AND as any[]).push({ payment_date: { gte: params.dateFrom } });
    if (params.dateTo) (where.AND as any[]).push({ payment_date: { lte: params.dateTo } });
    if (params.method) (where.AND as any[]).push({ method: { equals: params.method } });
    if (params.search) (where.AND as any[]).push({ OR: [
      { reference: { contains: params.search, mode: 'insensitive' } },
      { method: { contains: params.search, mode: 'insensitive' } },
    ]});
    if ((where.AND as any[]).length === 0) delete where.AND;

    const allowedSort: Record<string, string> = { payment_date: 'payment_date', amount: 'amount', method: 'method' };
    let sortField: string = 'payment_date';
    if (params.sortKey && allowedSort[params.sortKey]) {
      sortField = allowedSort[params.sortKey] as string;
    }
    const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';
    const orderBy: any = {};
    (orderBy as any)[sortField] = sortDir;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        orderBy,
        include: {
          invoice: { select: { id: true, invoice_date: true, projectId: true } },
          expense: { select: { id: true, date: true, projectId: true } },
          project: { select: { id: true, name: true } } as any,
        },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);
    return { rows, total, page: params.page, pageSize: params.pageSize };
  }

  async get(id: string) {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Payment not found');
    return p;
  }

  create(data: { invoiceId?: string | null; expenseId?: string | null; projectId?: string | null; amount: number; payment_date: Date; method?: string | null; reference?: string | null; created_by?: string }) {
    return this.prisma.payment.create({ data: {
      invoiceId: data.invoiceId || null,
      expenseId: data.expenseId || null,
      projectId: data.projectId || null,
      amount: data.amount,
      payment_date: data.payment_date,
      method: data.method || null,
      reference: data.reference || null,
    } });
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

  async bulkCreate(rows: Array<{ invoiceId?: string | null; expenseId?: string | null; projectId?: string | null; amount: number; payment_date: Date; method?: string | null; reference?: string | null }>) {
    if (!rows?.length) return { count: 0 };
    const data = rows.map((r) => ({
      invoiceId: r.invoiceId || null,
      expenseId: r.expenseId || null,
      projectId: r.projectId || null,
      amount: r.amount,
      payment_date: r.payment_date,
      method: r.method || null,
      reference: r.reference || null,
    }));
    const res = await this.prisma.payment.createMany({ data });
    return { count: res.count };
  }

  toCsv(rows: any[]): string {
    const header = ['Payment Date','Project','Invoice','Expense','Method','Amount','Reference'];
    const fmt = (v: any) => v === undefined || v === null ? '' : String(v).replace(/\r|\n/g, ' ').replace(/"/g, '""');
    const lines = [header.join(',')];
    for (const r of rows) {
      const date = new Date(r.payment_date).toISOString().slice(0,10);
      const line = [date, r.project?.name || '', r.invoice?.id || '', r.expense?.id || '', r.method || '', r.amount ?? '', r.reference || '']
        .map((x) => `"${fmt(x)}"`).join(',');
      lines.push(line);
    }
    return lines.join('\r\n');
  }

  async aggregateTotal(params: { invoiceId?: string; expenseId?: string; projectId?: string; dateFrom?: Date; dateTo?: Date; method?: string; search?: string }) {
    const where: any = {
      invoiceId: params.invoiceId || undefined,
      expenseId: params.expenseId || undefined,
      projectId: params.projectId || undefined,
      AND: [],
    };
    if (params.dateFrom) (where.AND as any[]).push({ payment_date: { gte: params.dateFrom } });
    if (params.dateTo) (where.AND as any[]).push({ payment_date: { lte: params.dateTo } });
    if (params.method) (where.AND as any[]).push({ method: { equals: params.method } });
    if (params.search) (where.AND as any[]).push({ OR: [
      { reference: { contains: params.search, mode: 'insensitive' } },
      { method: { contains: params.search, mode: 'insensitive' } },
    ]});
    if ((where.AND as any[]).length === 0) delete where.AND;
    const agg = await this.prisma.payment.aggregate({ _sum: { amount: true }, where });
    return { totalAmount: agg._sum.amount || 0 };
  }
}
