import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  async list(params: { projectId?: string; vendorId?: string; dateFrom?: Date; dateTo?: Date; search?: string; page: number; pageSize: number; sortKey?: string; sortDir?: 'asc' | 'desc'; category?: string }) {
    const where: any = {
      projectId: params.projectId || undefined,
      vendorId: params.vendorId || undefined,
      category: params.category || undefined,
      AND: [],
    };
    if (params.dateFrom) (where.AND as any[]).push({ date: { gte: params.dateFrom } });
    if (params.dateTo) (where.AND as any[]).push({ date: { lte: params.dateTo } });
    if (params.search) (where.AND as any[]).push({ OR: [
      { category: { contains: params.search, mode: 'insensitive' } },
      { note: { contains: params.search, mode: 'insensitive' } },
    ]});
    if ((where.AND as any[]).length === 0) delete where.AND;

    const allowedSort: Record<string, any> = { date: 'date', amount: 'amount', category: 'category' };
    const orderBy = params.sortKey && allowedSort[params.sortKey]
      ? { [allowedSort[params.sortKey]]: params.sortDir === 'asc' ? 'asc' : 'desc' }
      : { date: 'desc' } as any;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        orderBy,
        include: {
          vendor: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } } as any,
        },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);
    return { rows, total, page: params.page, pageSize: params.pageSize };
  }

  async get(id: string) {
    const e = await this.prisma.expense.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Expense not found');
    return e;
  }

  create(
    body: { projectId?: string; vendorId?: string; date: Date; amount: number; category: string; note?: string },
    user?: { id?: string; name?: string; email?: string },
  ) {
    return this.prisma.expense.create({
      data: body,
      include: {
        project: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      } as any,
    } as any).then((created: any) => {
      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'created',
          entityType: 'Expense',
          entityId: created.id,
          entityName: created.category,
          extra: {
            projectId: created.projectId,
            projectName: created.project?.name,
            vendorId: created.vendorId,
            vendorName: created.vendor?.name,
            amount: created.amount,
            category: created.category,
          },
        })
        .catch(() => {});
      return created;
    });
  }

  update(
    id: string,
    data: Partial<{ projectId?: string; vendorId?: string; date: Date; amount: number; category: string; note?: string }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    return this.prisma.expense.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      } as any,
    } as any).then((updated: any) => {
      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'updated',
          entityType: 'Expense',
          entityId: updated.id,
          entityName: updated.category,
          extra: {
            projectId: updated.projectId,
            projectName: updated.project?.name,
            vendorId: updated.vendorId,
            vendorName: updated.vendor?.name,
            amount: updated.amount,
            category: updated.category,
          },
        })
        .catch(() => {});
      return updated;
    });
  }

  delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    return this.prisma.expense.delete({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      } as any,
    } as any).then((deleted: any) => {
      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'deleted',
          entityType: 'Expense',
          entityId: deleted.id,
          entityName: deleted.category,
          extra: {
            projectId: deleted.projectId,
            projectName: deleted.project?.name,
            vendorId: deleted.vendorId,
            vendorName: deleted.vendor?.name,
            amount: deleted.amount,
            category: deleted.category,
          },
        })
        .catch(() => {});
      return deleted;
    });
  }

  async bulkCreate(
    rows: Array<{ projectId?: string; vendorId?: string; date: Date; amount: number; category: string; note?: string }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    if (!rows?.length) return { count: 0 };
    const data = rows.map((r) => ({
      projectId: r.projectId || null,
      vendorId: r.vendorId || null,
      date: r.date,
      amount: r.amount,
      category: r.category,
      note: r.note || null,
    }));
    const res = await this.prisma.expense.createMany({ data });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'ExpenseBulk',
        entityId: undefined,
        entityName: undefined,
        extra: {
          count: res.count,
        },
      })
      .catch(() => {});

    return { count: res.count };
  }

  toCsv(rows: any[]): string {
    const header = ['Date','Project','Vendor','Category','Amount','Note'];
    const fmt = (v: any) => v === undefined || v === null ? '' : String(v).replace(/\r|\n/g, ' ').replace(/"/g, '""');
    const lines = [header.join(',')];
    for (const r of rows) {
      const date = new Date(r.date).toISOString().slice(0,10);
      const line = [date, r.project?.name || '', r.vendor?.name || '', r.category || '', r.amount ?? '', r.note || '']
        .map((x) => `"${fmt(x)}"`).join(',');
      lines.push(line);
    }
    return lines.join('\r\n');
  }

  async aggregateTotal(params: { projectId?: string; vendorId?: string; dateFrom?: Date; dateTo?: Date; search?: string; category?: string }) {
    const where: any = {
      projectId: params.projectId || undefined,
      vendorId: params.vendorId || undefined,
      category: params.category || undefined,
      AND: [],
    };
    if (params.dateFrom) (where.AND as any[]).push({ date: { gte: params.dateFrom } });
    if (params.dateTo) (where.AND as any[]).push({ date: { lte: params.dateTo } });
    if (params.search) (where.AND as any[]).push({ OR: [
      { category: { contains: params.search, mode: 'insensitive' } },
      { note: { contains: params.search, mode: 'insensitive' } },
    ]});
    if ((where.AND as any[]).length === 0) delete where.AND;
    const agg = await this.prisma.expense.aggregate({ _sum: { amount: true }, where });
    return { totalAmount: agg._sum.amount || 0 };
  }

  async aggregateUnifiedTotal(params: { projectId?: string; dateFrom?: Date; dateTo?: Date }) {
    const { projectId, dateFrom, dateTo } = params;

    // 1) Core + General expenses (all categories) from Expense table
    const expenseWhere: any = {
      projectId: projectId || undefined,
      AND: [],
    };
    if (dateFrom) (expenseWhere.AND as any[]).push({ date: { gte: dateFrom } });
    if (dateTo) (expenseWhere.AND as any[]).push({ date: { lte: dateTo } });
    if ((expenseWhere.AND as any[]).length === 0) delete expenseWhere.AND;

    // 2) Payroll (company employee salary) — SalaryPaid + Loan from deductions_json
    const payrollWhere: any = {};
    if (dateFrom || dateTo) {
      const and: any[] = [];
      if (dateFrom) and.push({ month: { gte: dateFrom } });
      if (dateTo) and.push({ month: { lte: dateTo } });
      if (and.length) payrollWhere.AND = and;
    }

    // 3) External Labour Expense – total Paid Amount across all vendors/months
    const externalLabourWhere: any = {};
    if (dateFrom || dateTo) {
      const and: any[] = [];
      if (dateFrom) {
        and.push({ month: { gte: new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1) } });
      }
      if (dateTo) {
        and.push({ month: { lte: new Date(dateTo.getFullYear(), dateTo.getMonth(), 1) } });
      }
      if (and.length) externalLabourWhere.AND = and;
    }

    const [expenseAgg, payrollRows, externalLabourAgg] = await this.prisma.$transaction([
      this.prisma.expense.aggregate({ _sum: { amount: true }, where: expenseWhere }),
      this.prisma.payroll.findMany({ where: payrollWhere }),
      this.prisma.externalLabourExpense.aggregate({ _sum: { paidAmount: true }, where: externalLabourWhere }),
    ]);

    const expensesTotal = Number(expenseAgg._sum.amount ?? 0) || 0;
    const externalLabourPaidTotal = Number(externalLabourAgg._sum.paidAmount ?? 0) || 0;

    let salaryTotal = 0;
    for (const p of payrollRows as any[]) {
      let extras: any = p.deductions_json ?? {};
      if (typeof extras === 'string') {
        try {
          extras = JSON.parse(extras);
        } catch {
          extras = {};
        }
      }
      const salaryPaid = typeof extras.salaryPaid === 'number' && !Number.isNaN(extras.salaryPaid)
        ? extras.salaryPaid
        : 0;
      const loan = typeof extras.loan === 'number' && !Number.isNaN(extras.loan)
        ? extras.loan
        : 0;

      if (extras.salaryPaid !== undefined || extras.loan !== undefined) {
        salaryTotal += salaryPaid + loan;
      }
    }

    const total = expensesTotal + salaryTotal + externalLabourPaidTotal;
    return { totalAmount: Math.round(total * 100) / 100 };
  }
}
