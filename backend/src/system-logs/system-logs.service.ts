import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemLogsService {
  constructor(private prisma: PrismaService) {}

  async list(params: { page: number; pageSize: number; level?: string }) {
    const where: any = {};
    if (params.level) where.level = params.level;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.systemLog.count({ where }),
      this.prisma.systemLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);
    return { data, total };
  }

  async logActivity(input: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    action: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    level?: string;
    extra?: Record<string, any>;
  }) {
    const {
      userId,
      userName,
      userEmail,
      action,
      entityType,
      entityId,
      entityName,
      extra,
      level = 'INFO',
    } = input;

    const context = {
      userId,
      userName,
      userEmail,
      action,
      entityType,
      entityId,
      entityName,
      ...extra,
    };

    const messageParts = [
      userName || userEmail || 'Someone',
      action,
      entityType.toLowerCase(),
      entityName ? `"${entityName}"` : entityId || '',
    ].filter(Boolean);

    const message = messageParts.join(' ');

    await this.prisma.systemLog.create({
      data: {
        level,
        message,
        context_json: JSON.stringify(context),
      },
    });
  }
}
