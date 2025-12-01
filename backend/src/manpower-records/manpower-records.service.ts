import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class ManpowerRecordsService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  list(params?: { projectId?: string; vendorId?: string }) {
    const where: any = {};
    if (params?.projectId) where.projectId = params.projectId;
    if (params?.vendorId) where.vendorId = params.vendorId;
    return this.prisma.manpowerRecord.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: {
        project: { select: { id: true, name: true, site: true, main_contractor: true } },
        vendor: { select: { id: true, name: true } },
      },
    });
  }

  async get(id: string) {
    const rec = await this.prisma.manpowerRecord.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, site: true, main_contractor: true } },
        vendor: { select: { id: true, name: true } },
      },
    });
    if (!rec) throw new NotFoundException('Manpower record not found');
    return rec;
  }

  async create(
    data: {
      projectId: string;
      vendorId: string;
      site: string;
      main_contractor?: string | null;
      totalLabour: number;
      dailyRate: number;
      total: number;
      date?: string | Date | null;
    },
    user?: { id?: string; name?: string; email?: string },
  ) {
    const project = await this.prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new NotFoundException('Invalid projectId');
    const vendor = await this.prisma.vendor.findUnique({ where: { id: data.vendorId } });
    if (!vendor) throw new NotFoundException('Invalid vendorId');
    const payload: any = {
      projectId: data.projectId,
      vendorId: data.vendorId,
      site: data.site,
      main_contractor: data.main_contractor ?? project.main_contractor ?? null,
      totalLabour: data.totalLabour,
      dailyRate: data.dailyRate,
      total: data.total,
    };
    if (data.date) {
      const jsDate = typeof data.date === 'string' ? new Date(data.date) : data.date;
      if (!Number.isNaN(jsDate.getTime())) {
        payload.date = jsDate;
      }
    }
    const created = await this.prisma.manpowerRecord.create({ data: payload });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'ManpowerRecord',
        entityId: created.id,
        entityName: created.site,
        extra: {
          projectId: created.projectId,
          projectName: project.name,
          vendorId: created.vendorId,
          vendorName: vendor.name,
          site: created.site,
          totalLabour: created.totalLabour,
          dailyRate: created.dailyRate,
          total: created.total,
          date: created.date,
        },
      })
      .catch(() => {});

    return created;
  }

  async remove(id: string, user?: { id?: string; name?: string; email?: string }) {
    const existing = await this.prisma.manpowerRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Manpower record not found');
    await this.prisma.manpowerRecord.delete({ where: { id } });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'deleted',
        entityType: 'ManpowerRecord',
        entityId: existing.id,
        entityName: existing.site,
        extra: {
          projectId: existing.projectId,
          vendorId: existing.vendorId,
          site: existing.site,
          totalLabour: existing.totalLabour,
          dailyRate: existing.dailyRate,
          total: existing.total,
          date: existing.date,
        },
      })
      .catch(() => {});

    return { success: true };
  }
}
