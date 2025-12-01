import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  list() {
    return this.prisma.client.findMany({ orderBy: { name: 'asc' } });
  }

  async get(id: string) {
    const c = await this.prisma.client.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Client not found');
    return c;
  }

  async create(
    data: { name: string; contact?: string | null; projects_linked_json?: any },
    user?: { id?: string; name?: string; email?: string },
  ) {
    const client = await this.prisma.client.create({ data });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'Client',
        entityId: client.id,
        entityName: client.name,
        extra: {
          contact: client.contact,
        },
      })
      .catch(() => {});

    return client;
  }

  async update(
    id: string,
    data: Partial<{ name: string; contact?: string | null; projects_linked_json?: any }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    const client = await this.prisma.client.update({ where: { id }, data });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'updated',
        entityType: 'Client',
        entityId: client.id,
        entityName: client.name,
        extra: {
          contact: client.contact,
        },
      })
      .catch(() => {});

    return client;
  }

  async delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    const client = await this.prisma.client.delete({ where: { id } });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'deleted',
        entityType: 'Client',
        entityId: client.id,
        entityName: client.name,
        extra: {
          contact: client.contact,
        },
      })
      .catch(() => {});

    return client;
  }
}
