import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  async list(params: { page?: number; pageSize?: number; employeeId?: string; month?: Date }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
    const where: any = {};
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.month) {
      // filter by same calendar month
      const start = new Date(params.month.getFullYear(), params.month.getMonth(), 1);
      const end = new Date(params.month.getFullYear(), params.month.getMonth() + 1, 0, 23, 59, 59, 999);
      where.month = { gte: start, lte: end };
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.payroll.count({ where }),
      this.prisma.payroll.findMany({
        where,
        include: { employee: true },
        orderBy: { month: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { data, total, page, pageSize };
  }

  async get(id: string, user?: { id?: string; name?: string; email?: string }) {
    const rec = await this.prisma.payroll.findUnique({ where: { id }, include: { employee: true } });
    if (!rec) throw new NotFoundException('Payroll not found');
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'viewed',
        entityType: 'Payroll',
        entityId: rec.id,
        entityName: rec.employee?.employeeName,
        extra: {
          employeeId: rec.employeeId,
          month: rec.month,
        },
      })
      .catch(() => {});
    return rec;
  }

  async create(
    body: { employeeId: string; month: string; gross: number; net: number; deductions_json?: any },
    user?: { id?: string; name?: string; email?: string },
  ) {
    const data: any = {
      employeeId: body.employeeId,
      month: new Date(body.month),
      gross: body.gross,
      net: body.net,
    };
    if (body.deductions_json && typeof body.deductions_json !== 'string') {
      data.deductions_json = JSON.stringify(body.deductions_json);
    } else if (body.deductions_json) {
      data.deductions_json = body.deductions_json;
    }
    const created = await this.prisma.payroll.create({ data, include: { employee: true } });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'Payroll',
        entityId: created.id,
        entityName: created.employee?.employeeName,
        extra: {
          employeeId: created.employeeId,
          month: created.month,
          gross: created.gross,
          net: created.net,
        },
      })
      .catch(() => {});
    return created;
  }

  async update(
    id: string,
    body: Partial<{ month: string; gross: number; net: number; deductions_json?: any }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    const data: any = {};
    if (body.month) data.month = new Date(body.month);
    if (body.gross !== undefined) data.gross = body.gross;
    if (body.net !== undefined) data.net = body.net;
    if (body.deductions_json !== undefined) {
      data.deductions_json =
        typeof body.deductions_json === 'string' ? body.deductions_json : JSON.stringify(body.deductions_json);
    }
    const updated = await this.prisma.payroll.update({ where: { id }, data, include: { employee: true } });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'updated',
        entityType: 'Payroll',
        entityId: updated.id,
        entityName: updated.employee?.employeeName,
        extra: {
          employeeId: updated.employeeId,
          month: updated.month,
          gross: updated.gross,
          net: updated.net,
        },
      })
      .catch(() => {});
    return updated;
  }

  async delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    const deleted = await this.prisma.payroll.delete({ where: { id }, include: { employee: true } });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'deleted',
        entityType: 'Payroll',
        entityId: deleted.id,
        entityName: deleted.employee?.employeeName,
        extra: {
          employeeId: deleted.employeeId,
          month: deleted.month,
          gross: deleted.gross,
          net: deleted.net,
        },
      })
      .catch(() => {});
    return deleted;
  }
}
