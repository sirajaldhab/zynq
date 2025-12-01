import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  async list(params: { projectId?: string; clientId?: string; status?: string; dateFrom?: Date; dateTo?: Date; search?: string; page: number; pageSize: number; sortKey?: string; sortDir?: 'asc' | 'desc' }) {
    const where: any = {
      projectId: params.projectId || undefined,
      clientId: params.clientId || undefined,
      // Let the frontend handle UI statuses 'All', 'Pending', and 'Received' in-memory.
      // Only pass through other explicit status values to Prisma.
      status:
        params.status && !['All', 'Pending', 'Received'].includes(params.status)
          ? params.status
          : undefined,
      AND: [],
    };
    if (params.dateFrom) (where.AND as any[]).push({ invoice_date: { gte: params.dateFrom } });
    if (params.dateTo) (where.AND as any[]).push({ invoice_date: { lte: params.dateTo } });
    if (params.search) (where.AND as any[]).push({ OR: [
      { invoice_no: { contains: params.search } },
      { status: { contains: params.search } },
    ]});
    if ((where.AND as any[]).length === 0) delete where.AND;

    const allowedSort: Record<string, string> = { invoice_date: 'invoice_date', total: 'total', status: 'status' };
    let sortField: string = 'invoice_date';
    if (params.sortKey && allowedSort[params.sortKey]) {
      sortField = allowedSort[params.sortKey] as string;
    }
    const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';
    const orderBy: any = {};
    (orderBy as any)[sortField] = sortDir;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        orderBy,
        include: {
          project: { select: { id: true, name: true } } as any,
          client: { select: { id: true, name: true } },
          payments: { select: { id: true, amount: true } },
        },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);
    return { rows, total, page: params.page, pageSize: params.pageSize };
  }

  async get(id: string) {
    const inv = await this.prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async create(
    data: {
      projectId: string;
      clientId: string;
      invoice_no?: string;
      invoice_date: Date;
      due_date?: Date;
      items_json: any;
      subtotal: number;
      vat: number;
      total: number;
      status?: string;
    },
    user?: { id?: string; name?: string; email?: string },
  ) {
    const toCreate: any = { ...data };
    if (typeof toCreate.items_json !== 'string') {
      toCreate.items_json = JSON.stringify(toCreate.items_json ?? {});
    }
    // Validate foreign keys early for clearer error messages
    const [project, client] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: toCreate.projectId } }),
      this.prisma.client.findUnique({ where: { id: toCreate.clientId } }),
    ]);
    if (!project) throw new BadRequestException('Invalid projectId: project not found');
    if (!client) throw new BadRequestException('Invalid clientId: client not found');
    try {
      const created = await this.prisma.invoice.create({ data: toCreate });

      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'created',
          entityType: 'Invoice',
          entityId: created.id,
          entityName: created.invoice_no || undefined,
          extra: {
            projectId: created.projectId,
            projectName: project.name,
            clientId: created.clientId,
            clientName: client.name,
            status: created.status,
            total: created.total,
          },
        })
        .catch(() => {});

      return created;
    } catch (e: any) {
      throw new BadRequestException(e?.message || 'Failed to create invoice');
    }
  }

  update(
    id: string,
    data: Partial<{
      projectId?: string;
      invoice_no?: string;
      invoice_date: Date;
      due_date?: Date;
      items_json: any;
      subtotal: number;
      vat: number;
      total: number;
      status?: string;
    }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    const toUpdate: any = { ...data };
    if (toUpdate.items_json && typeof toUpdate.items_json !== 'string') {
      toUpdate.items_json = JSON.stringify(toUpdate.items_json);
    }
    return this.prisma.invoice.update({ where: { id }, data: toUpdate, include: { project: { select: { id: true, name: true } }, client: { select: { id: true, name: true } } } as any }).then((updated: any) => {
      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'updated',
          entityType: 'Invoice',
          entityId: updated.id,
          entityName: updated.invoice_no || undefined,
          extra: {
            projectId: updated.projectId,
            projectName: updated.project?.name,
            clientId: updated.clientId,
            clientName: updated.client?.name,
            status: updated.status,
            total: updated.total,
          },
        })
        .catch(() => {});
      return updated;
    });
  }

  delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    return this.prisma.invoice.delete({ where: { id }, include: { project: { select: { id: true, name: true } }, client: { select: { id: true, name: true } } } as any }).then((deleted: any) => {
      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'deleted',
          entityType: 'Invoice',
          entityId: deleted.id,
          entityName: deleted.invoice_no || undefined,
          extra: {
            projectId: deleted.projectId,
            projectName: deleted.project?.name,
            clientId: deleted.clientId,
            clientName: deleted.client?.name,
            status: deleted.status,
            subtotal: deleted.subtotal,
            vat: deleted.vat,
            total: deleted.total,
          },
        })
        .catch(() => {});
      return deleted;
    });
  }

  totals(projectId?: string) {
    return this.prisma.invoice.aggregate({
      _sum: { subtotal: true, vat: true, total: true },
      where: { projectId: projectId || undefined },
    });
  }

  async receivedTotal(params: { projectId?: string; dateFrom?: Date; dateTo?: Date }) {
    const where: any = {
      projectId: params.projectId || undefined,
      status: { in: ['received', 'Received', 'RECEIVED', 'paid', 'Paid', 'PAID'] },
      AND: [],
    };
    if (params.dateFrom) (where.AND as any[]).push({ invoice_date: { gte: params.dateFrom } });
    if (params.dateTo) (where.AND as any[]).push({ invoice_date: { lte: params.dateTo } });
    if ((where.AND as any[]).length === 0) delete where.AND;

    const agg = await this.prisma.invoice.aggregate({
      _sum: { total: true },
      where,
    });
    const total = Number(agg._sum.total ?? 0) || 0;
    return { totalAmount: Math.round(total * 100) / 100 };
  }

  async bulkCreate(
    rows: Array<{ projectId: string; clientId: string; invoice_date: Date; due_date?: Date; items_json: any; subtotal: number; vat: number; total: number; status?: string }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    if (!rows?.length) return { count: 0 };
    const data = rows.map((r) => ({
      projectId: r.projectId,
      clientId: r.clientId,
      invoice_date: r.invoice_date,
      due_date: r.due_date || null,
      items_json: typeof r.items_json === 'string' ? r.items_json : JSON.stringify(r.items_json ?? {}),
      subtotal: r.subtotal,
      vat: r.vat,
      total: r.total,
      status: r.status || 'DRAFT',
    }));
    const res = await this.prisma.invoice.createMany({ data });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'InvoiceBulk',
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
    const header = ['Invoice Date','Invoice No','Project','Client','Status','Subtotal','VAT','Total','Due Date'];
    const fmt = (v: any) => v === undefined || v === null ? '' : String(v).replace(/\r|\n/g, ' ').replace(/"/g, '""');
    const lines = [header.join(',')];
    for (const r of rows) {
      const invDate = new Date(r.invoice_date).toISOString().slice(0,10);
      const dueDate = r.due_date ? new Date(r.due_date).toISOString().slice(0,10) : '';
      const line = [invDate, r.invoice_no || '', r.project?.name || '', r.client?.name || '', r.status || '', r.subtotal ?? '', r.vat ?? '', r.total ?? '', dueDate]
        .map((x) => `"${fmt(x)}"`).join(',');
      lines.push(line);
    }
    return lines.join('\r\n');
  }
}
