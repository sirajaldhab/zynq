import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  async get(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(body: { name: string; description?: string; status?: string; permissionsJson?: string; baseRoleName?: string }) {
    const name = (body.name || '').trim();
    if (!name) throw new BadRequestException('Role name is required');
    const exists = await this.prisma.role.findUnique({ where: { name } });
    if (exists) throw new BadRequestException('Role name already exists');
    let permissionsJson = body.permissionsJson;
    if (!permissionsJson && body.baseRoleName) {
      const base = await this.prisma.role.findFirst({ where: { name: body.baseRoleName } });
      if (base?.permissionsJson) permissionsJson = base.permissionsJson;
    }
    const status = body.status && body.status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.prisma.role.create({ data: { name, description: body.description, status, permissionsJson: permissionsJson || '{}' } as any });
  }

  async update(id: string, body: Partial<{ name: string; description: string; status: string; permissionsJson: string }>) {
    const data: any = { ...body };
    if (body.name) {
      const newName = body.name.trim();
      if (!newName) throw new BadRequestException('Role name is required');
      const exists = await this.prisma.role.findFirst({ where: { name: newName, NOT: { id } } });
      if (exists) throw new BadRequestException('Role name already exists');
      data.name = newName;
    }
    if (typeof body.status !== 'undefined') {
      data.status = body.status && body.status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    }
    return this.prisma.role.update({ where: { id }, data });
  }

  async delete(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if ((role.name || '').toUpperCase() === 'ADMIN') {
      throw new BadRequestException('The ADMIN role cannot be deleted');
    }
    return this.prisma.role.delete({ where: { id } });
  }
}
