import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class LeavesService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  async list(params: { page?: number; pageSize?: number; status?: string; employeeId?: string; start?: Date; end?: Date }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.start || params.end) {
      where.start_date = {};
      if (params.start) where.start_date.gte = params.start;
      if (params.end) where.start_date.lte = params.end;
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.leave.count({ where }),
      this.prisma.leave.findMany({
        where,
        include: { employee: true },
        orderBy: { start_date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { data, total, page, pageSize };
  }

  async get(id: string, user?: { id?: string; name?: string; email?: string }) {
    const rec = await this.prisma.leave.findUnique({ where: { id }, include: { employee: true } });
    if (!rec) throw new NotFoundException('Leave not found');
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'viewed',
        entityType: 'Leave',
        entityId: rec.id,
        entityName: rec.employee?.employeeName,
        extra: {
          employeeId: rec.employeeId,
          type: rec.type,
          status: rec.status,
          startDate: rec.start_date,
        },
      })
      .catch(() => {});
    return rec;
  }

  async create(
    body: { employeeId: string; start_date: string; end_date: string; type: string; status?: string },
    user?: { id?: string; name?: string; email?: string },
  ) {
    const data: any = {
      employeeId: body.employeeId,
      start_date: new Date(body.start_date),
      end_date: new Date(body.end_date),
      type: body.type,
    };
    if (body.status) data.status = body.status;
    const created = await this.prisma.leave.create({ data, include: { employee: true } });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'Leave',
        entityId: created.id,
        entityName: created.employee?.employeeName,
        extra: {
          employeeId: created.employeeId,
          type: created.type,
          status: created.status,
          startDate: created.start_date,
        },
      })
      .catch(() => {});
    return created;
  }

  update(
    id: string,
    body: Partial<{ start_date: string; end_date: string; type: string; status: string }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    const data: any = {};
    if (body.start_date) data.start_date = new Date(body.start_date);
    if (body.end_date) data.end_date = new Date(body.end_date);
    if (body.type !== undefined) data.type = body.type;
    if (body.status !== undefined) data.status = body.status;
    return this.prisma.leave.update({ where: { id }, data, include: { employee: true } }).then((updated) => {
      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'updated',
          entityType: 'Leave',
          entityId: updated.id,
          entityName: updated.employee?.employeeName,
          extra: {
            employeeId: updated.employeeId,
            type: updated.type,
            status: updated.status,
            startDate: updated.start_date,
          },
        })
        .catch(() => {});
      return updated;
    });
  }

  delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    return this.prisma.leave.delete({ where: { id }, include: { employee: true } }).then((deleted) => {
      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'deleted',
          entityType: 'Leave',
          entityId: deleted.id,
          entityName: deleted.employee?.employeeName,
          extra: {
            employeeId: deleted.employeeId,
            type: deleted.type,
            status: deleted.status,
            startDate: deleted.start_date,
          },
        })
        .catch(() => {});
      return deleted;
    });
  }
}
