import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectExtrasService {
  constructor(private prisma: PrismaService) {}

  async findByProjectId(projectId: string) {
    if (!projectId) return null;
    const extra = await this.prisma.projectExtra.findUnique({
      where: { projectId },
    });
    return extra || null;
  }

  async upsertForProject(projectId: string, otherText: string) {
    const trimmed = (otherText ?? '').trim();

    const extra = await this.prisma.projectExtra.upsert({
      where: { projectId },
      update: { otherText: trimmed },
      create: { projectId, otherText: trimmed },
    });

    return extra;
  }
}
