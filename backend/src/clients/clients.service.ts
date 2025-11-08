import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.client.findMany({ orderBy: { name: 'asc' } });
  }

  async get(id: string) {
    const c = await this.prisma.client.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Client not found');
    return c;
  }

  create(data: { name: string; contact?: string | null; projects_linked_json?: any }) {
    return this.prisma.client.create({ data });
  }

  update(id: string, data: Partial<{ name: string; contact?: string | null; projects_linked_json?: any }>) {
    return this.prisma.client.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.client.delete({ where: { id } });
  }
}
