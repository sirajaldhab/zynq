import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class MaterialsService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  list(projectId?: string) {
    return this.prisma.material.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { invoice_date: 'desc' },
      include: { vendor: { select: { id: true, name: true } } },
    });
  }

  async get(id: string) {
    const m = await this.prisma.material.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Material not found');
    return m;
  }

  async create(
    data: {
      projectId: string;
      invoice_date?: Date | null;
      vendorId?: string | null;
      item_description: string;
      quantity: number;
      unit_price?: number | null;
      vat?: number | null;
      total: number;
      attachments?: any;
    },
    user?: { id?: string; name?: string; email?: string },
  ) {
    const project = await this.prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new NotFoundException('Invalid projectId');
    const isUuid = (s?: string | null) => !!s && /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(s);
    const payload: any = { ...data };
    if (payload.vendorId && !isUuid(payload.vendorId)) {
      const name = String(payload.vendorId).trim();
      if (name) {
        const ven = await this.prisma.vendor.upsert({ where: { name }, update: {}, create: { name } });
        payload.vendorId = ven.id;
      } else {
        payload.vendorId = null;
      }
    }
    const created = await this.prisma.material.create({
      data: payload,
      include: {
        project: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
    });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'Material',
        entityId: created.id,
        entityName: created.item_description,
        extra: {
          projectId: created.projectId,
          projectName: created.project?.name,
          vendorId: created.vendorId,
          vendorName: created.vendor?.name,
          total: created.total,
        },
      })
      .catch(() => {});

    return created;
  }

  async update(
    id: string,
    data: Partial<{
      invoice_date?: Date | null;
      vendorId?: string | null;
      item_description: string;
      quantity: number;
      unit_price?: number | null;
      total: number;
      attachments?: any;
    }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    const updated = await this.prisma.material.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
    });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'updated',
        entityType: 'Material',
        entityId: updated.id,
        entityName: updated.item_description,
        extra: {
          projectId: updated.projectId,
          projectName: updated.project?.name,
          vendorId: updated.vendorId,
          vendorName: updated.vendor?.name,
          total: updated.total,
        },
      })
      .catch(() => {});
    return updated;
  }

  async delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    const deleted = await this.prisma.material.delete({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
    });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'deleted',
        entityType: 'Material',
        entityId: deleted.id,
        entityName: deleted.item_description,
        extra: {
          projectId: deleted.projectId,
          projectName: deleted.project?.name,
          vendorId: deleted.vendorId,
          vendorName: deleted.vendor?.name,
          total: deleted.total,
        },
      })
      .catch(() => {});
    return deleted;
  }
}
