import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class AttendanceService {
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
      where.check_in = {};
      if (params.start) where.check_in.gte = params.start;
      if (params.end) where.check_in.lte = params.end;
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.findMany({
        where,
        include: { employee: true },
        orderBy: { check_in: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { data, total, page, pageSize };
  }

  async get(id: string, user?: { id?: string; name?: string; email?: string }) {
    const rec = await this.prisma.attendance.findUnique({ where: { id }, include: { employee: true } });
    if (!rec) throw new NotFoundException('Attendance not found');
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'viewed',
        entityType: 'Attendance',
        entityId: rec.id,
        entityName: rec.employee?.employeeName,
        extra: {
          employeeId: rec.employeeId,
          status: rec.status,
          checkIn: rec.check_in,
        },
      })
      .catch(() => {});
    return rec;
  }

  async create(
    body: { employeeId: string; emiratesId?: string; check_in: string; check_out?: string; status?: string; location?: string; approvedBy?: string; otHours?: number; signature?: string },
    user?: { id?: string; name?: string; email?: string },
  ) {
    const checkIn = new Date(body.check_in);
    const startOfDay = new Date(checkIn);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkIn);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId: body.employeeId,
        check_in: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const data: any = {
      employeeId: body.employeeId,
      check_in: checkIn,
    };
    if (body.check_out) data.check_out = new Date(body.check_out);
    if (body.status) data.status = body.status;
    if (body.location) data.location = body.location;
    if (body.approvedBy) data.approvedBy = body.approvedBy;
    if (body.otHours !== undefined) data.otHours = body.otHours;
    if (body.signature !== undefined) data.signature = body.signature;

    // If status is Absent or Holiday, ensure previous working fields are cleared
    if (body.status) {
      const s = String(body.status).toUpperCase();
      if (s === 'A' || s === 'ABSENT' || s === 'HOLIDAY') {
        data.check_out = null;
        data.location = null;
        data.otHours = 0;
        data.signature = null;
      }
    }

    if (existing) {
      const updated = await this.prisma.attendance.update({ where: { id: existing.id }, data, include: { employee: true } });
      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'updated',
          entityType: 'Attendance',
          entityId: updated.id,
          entityName: updated.employee?.employeeName,
          extra: {
            employeeId: updated.employeeId,
            status: updated.status,
            checkIn: updated.check_in,
          },
        })
        .catch(() => {});
      return updated;
    }

    const created = await this.prisma.attendance.create({ data, include: { employee: true } });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'Attendance',
        entityId: created.id,
        entityName: created.employee?.employeeName,
        extra: {
          employeeId: created.employeeId,
          status: created.status,
          checkIn: created.check_in,
        },
      })
      .catch(() => {});
    return created;
  }

  async update(
    id: string,
    data: Partial<{ check_in: string; check_out?: string; status?: string; location?: string; approvedBy?: string; otHours?: number; signature?: string }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    const toUpdate: any = {};
    if (data.check_in) toUpdate.check_in = new Date(data.check_in);
    if (data.check_out) toUpdate.check_out = new Date(data.check_out);
    if (data.status !== undefined) toUpdate.status = data.status;
    if (data.location !== undefined) toUpdate.location = data.location;
    if (data.approvedBy !== undefined) toUpdate.approvedBy = data.approvedBy;
    if (data.otHours !== undefined) toUpdate.otHours = data.otHours;
    if (data.signature !== undefined) toUpdate.signature = data.signature;

    // If status is Absent or Holiday, clear working fields even if the client
    // did not explicitly send blank values, so resubmissions truly overwrite.
    if (data.status !== undefined) {
      const s = String(data.status).toUpperCase();
      if (s === 'A' || s === 'ABSENT' || s === 'HOLIDAY') {
        toUpdate.check_out = null;
        toUpdate.location = null;
        toUpdate.otHours = 0;
        toUpdate.signature = null;
      }
    }
    const updated = await this.prisma.attendance.update({ where: { id }, data: toUpdate, include: { employee: true } });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'updated',
        entityType: 'Attendance',
        entityId: updated.id,
        entityName: updated.employee?.employeeName,
        extra: {
          employeeId: updated.employeeId,
          status: updated.status,
          checkIn: updated.check_in,
        },
      })
      .catch(() => {});
    return updated;
  }

  async delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    const deleted = await this.prisma.attendance.delete({ where: { id }, include: { employee: true } });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'deleted',
        entityType: 'Attendance',
        entityId: deleted.id,
        entityName: deleted.employee?.employeeName,
        extra: {
          employeeId: deleted.employeeId,
          status: deleted.status,
          checkIn: deleted.check_in,
        },
      })
      .catch(() => {});
    return deleted;
  }
}
