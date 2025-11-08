import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.project.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string) {
    const p = await this.prisma.project.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Project not found');
    return p;
  }

  create(data: { companyId: string; name: string; main_contractor?: string | null; consultant?: string | null; project_manager_id?: string | null; plots_json?: any; start_date?: Date | null; end_date?: Date | null; status?: string; }) {
    return this.prisma.project.create({ data });
  }

  update(id: string, data: Partial<{ name: string; main_contractor?: string | null; consultant?: string | null; project_manager_id?: string | null; plots_json?: any; start_date?: Date | null; end_date?: Date | null; status?: string; }>) {
    return this.prisma.project.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
