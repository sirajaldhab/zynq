import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class ExternalLabourExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemLogs: SystemLogsService,
  ) {}

  async list(params: { vendorId?: string; monthFrom?: Date; monthTo?: Date }) {
    const where: any = {};
    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.monthFrom || params.monthTo) {
      const and: any[] = [];
      if (params.monthFrom) and.push({ month: { gte: params.monthFrom } });
      if (params.monthTo) and.push({ month: { lte: params.monthTo } });
      if (and.length) where.AND = and;
    }
    return this.prisma.externalLabourExpense.findMany({
      where,
      include: { vendor: { select: { id: true, name: true } } },
      orderBy: [{ vendor: { name: 'asc' } }, { month: 'asc' }],
    });
  }

  private normalizeMonth(input: string | Date): Date {
    const d = new Date(input as any);
    if (Number.isNaN(d.getTime())) throw new Error('Invalid month');
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  async upsert(
    payload: {
      vendorId: string;
      month: string;
      totalLabour: number;
      total: number;
      paidAmount: number;
      notes?: string;
    },
    user?: { id?: string; name?: string; email?: string },
  ) {
    const month = this.normalizeMonth(payload.month);

    // Compute EXACT previous month (Year+Month-1) and fetch PM Balance only for same supplier & month
    const year = month.getFullYear();
    const monthIndex = month.getMonth(); // 0-11
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevMonth = new Date(prevYear, prevMonthIndex, 1);

    const prev = await this.prisma.externalLabourExpense.findFirst({
      where: {
        vendorId: payload.vendorId,
        month: prevMonth,
      },
    });

    const pmBalance = prev?.balance ?? 0;
    const totalLabour = Number(payload.totalLabour) || 0;
    const total = Number(payload.total) || 0;
    const paidAmount = Number(payload.paidAmount) || 0;
    const balance = total + pmBalance - paidAmount;

    const data = {
      vendorId: payload.vendorId,
      month,
      totalLabour,
      total,
      pmBalance,
      paidAmount,
      balance,
      notes: payload.notes ?? null,
      updatedAt: new Date(),
    };

    const existing = await this.prisma.externalLabourExpense
      .findUnique({
        where: {
          vendorId_month: {
            vendorId: payload.vendorId,
            month,
          },
        },
      })
      .catch(() => null);

    let row;
    if (existing) {
      row = await this.prisma.externalLabourExpense.update({
        where: { vendorId_month: { vendorId: payload.vendorId, month } },
        data,
        include: { vendor: { select: { id: true, name: true } } },
      });
    } else {
      row = await this.prisma.externalLabourExpense.create({
        data: { ...data, createdAt: new Date() },
        include: { vendor: { select: { id: true, name: true } } },
      });
    }

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: existing ? 'updated' : 'created',
        entityType: 'ExternalLabourExpense',
        entityId: row.id,
        entityName: row.vendor?.name,
        extra: {
          vendorId: row.vendorId,
          vendorName: row.vendor?.name,
          month: row.month,
          totalLabour: row.totalLabour,
          total: row.total,
          paidAmount: row.paidAmount,
          pmBalance: row.pmBalance,
          balance: row.balance,
        },
      })
      .catch(() => {});

    return row;
  }
}
