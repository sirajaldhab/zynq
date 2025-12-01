import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

interface UpsertSiteDaySalaryDto {
  id?: string;
  site: string;
  daySalary: number;
}

@Injectable()
export class SiteDaySalariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemLogs: SystemLogsService,
  ) {}

  async findAll(user?: { id?: string; name?: string; email?: string }) {
    const rows = await this.prisma.siteDaySalary.findMany({
      orderBy: { site: 'asc' },
    });
    return { data: rows };
  }

  async upsert(body: UpsertSiteDaySalaryDto, user?: { id?: string; name?: string; email?: string }) {
    const { id, site, daySalary } = body;

    if (id) {
      const updated = await this.prisma.siteDaySalary.update({
        where: { id },
        data: { site, daySalary },
      });
      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'updated',
          entityType: 'SiteDaySalary',
          entityId: updated.id,
          entityName: updated.site,
          extra: {
            daySalary: updated.daySalary,
          },
        })
        .catch(() => {});
      return updated;
    }

    const created = await this.prisma.siteDaySalary.upsert({
      where: { site },
      create: { site, daySalary },
      update: { daySalary },
    });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'SiteDaySalary',
        entityId: created.id,
        entityName: created.site,
        extra: {
          daySalary: created.daySalary,
        },
      })
      .catch(() => {});
    return created;
  }
}
