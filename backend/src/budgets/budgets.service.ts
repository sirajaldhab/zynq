import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  async list(params: { projectId?: string; dateFrom?: Date; dateTo?: Date; search?: string; page: number; pageSize: number }) {
    const where: any = {
      projectId: params.projectId || undefined,
      AND: [],
    };
    if (params.dateFrom) (where.AND as any[]).push({ periodStart: { gte: params.dateFrom } });
    if (params.dateTo) (where.AND as any[]).push({ periodEnd: { lte: params.dateTo } });
    if (params.search) (where.AND as any[]).push({ OR: [
      { category: { contains: params.search, mode: 'insensitive' } },
    ]});
    if ((where.AND as any[]).length === 0) delete where.AND;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.budget.count({ where }),
      this.prisma.budget.findMany({
        where,
        orderBy: { periodStart: 'desc' },
        include: { project: { select: { id: true, name: true } } } as any,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);
    return { rows, total, page: params.page, pageSize: params.pageSize };
  }

  async get(id: string, user?: { id?: string; name?: string; email?: string }) {
    const b = (await this.prisma.budget.findUnique({
      where: { id },
      include: { project: { select: { id: true, name: true } } } as any,
    })) as any;
    if (!b) throw new NotFoundException('Budget not found');
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'viewed',
        entityType: 'Budget',
        entityId: b.id,
        entityName: b.category || b.project?.name,
        extra: {
          projectId: b.projectId,
          projectName: b.project?.name,
          periodStart: b.periodStart,
          periodEnd: b.periodEnd,
          amount: b.amount,
          spent: b.spent,
        },
      })
      .catch(() => {});
    return b;
  }

  async create(
    body: { projectId: string; periodStart: Date; periodEnd: Date; amount: number; spent?: number; category?: string },
    user?: { id?: string; name?: string; email?: string },
  ) {
    const created = (await this.prisma.budget.create({
      data: body,
      include: { project: { select: { id: true, name: true } } } as any,
    })) as any;
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'Budget',
        entityId: created.id,
        entityName: created.category || created.project?.name,
        extra: {
          projectId: created.projectId,
          projectName: created.project?.name,
          periodStart: created.periodStart,
          periodEnd: created.periodEnd,
          amount: created.amount,
          spent: created.spent,
        },
      })
      .catch(() => {});
    return created;
  }

  async update(
    id: string,
    data: Partial<{ periodStart: Date; periodEnd: Date; amount: number; spent: number; category?: string }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    const updated = (await this.prisma.budget.update({
      where: { id },
      data,
      include: { project: { select: { id: true, name: true } } } as any,
    })) as any;
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'updated',
        entityType: 'Budget',
        entityId: updated.id,
        entityName: updated.category || updated.project?.name,
        extra: {
          projectId: updated.projectId,
          projectName: updated.project?.name,
          periodStart: updated.periodStart,
          periodEnd: updated.periodEnd,
          amount: updated.amount,
          spent: updated.spent,
        },
      })
      .catch(() => {});
    return updated;
  }

  async delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    const deleted = (await this.prisma.budget.delete({
      where: { id },
      include: { project: { select: { id: true, name: true } } } as any,
    })) as any;
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'deleted',
        entityType: 'Budget',
        entityId: deleted.id,
        entityName: deleted.category || deleted.project?.name,
        extra: {
          projectId: deleted.projectId,
          projectName: deleted.project?.name,
          periodStart: deleted.periodStart,
          periodEnd: deleted.periodEnd,
          amount: deleted.amount,
          spent: deleted.spent,
        },
      })
      .catch(() => {});
    return deleted;
  }

  async bulkCreate(
    rows: Array<{ projectId: string; periodStart: Date; periodEnd: Date; amount: number; spent?: number; category?: string }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    if (!rows?.length) return { count: 0 };
    const data = rows.map((r) => ({
      projectId: r.projectId,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      amount: r.amount,
      spent: r.spent || 0,
      category: r.category || null,
    }));
    const res = await this.prisma.budget.createMany({ data });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'BudgetBulk',
        extra: {
          count: res.count,
        },
      })
      .catch(() => {});
    return { count: res.count };
  }

  toCsv(rows: any[]): string {
    const header = ['Period Start','Period End','Project','Category','Amount','Spent'];
    const fmt = (v: any) => v === undefined || v === null ? '' : String(v).replace(/\r|\n/g, ' ').replace(/"/g, '""');
    const lines = [header.join(',')];
    for (const r of rows) {
      const ps = new Date(r.periodStart).toISOString().slice(0,10);
      const pe = new Date(r.periodEnd).toISOString().slice(0,10);
      const line = [ps, pe, r.project?.name || '', r.category || '', r.amount ?? '', r.spent ?? '']
        .map((x) => `"${fmt(x)}"`).join(',');
      lines.push(line);
    }
    return lines.join('\r\n');
  }
}
