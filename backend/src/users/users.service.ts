import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async list(params: { page: number; pageSize: number; search?: string; role?: string; status?: string }) {
    const where: any = {};
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.role) where.roleId = params.role;
    if (params.status && params.status !== 'All') where.status = params.status;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);
    return { data, total };
  }

  async create(body: { email: string; name: string; password?: string; roleId: string; status?: string }) {
    const data: any = {
      email: body.email,
      name: body.name,
      roleId: body.roleId,
    };
    if (body.status) data.status = body.status;
    if (body.password) data.passwordHash = await argon2.hash(body.password);
    return this.prisma.user.create({ data, include: { role: true } });
  }

  async update(
    id: string,
    body: Partial<{ email: string; name: string; roleId: string; status: string; password?: string }>,
  ) {
    const data: any = {};
    if (body.email !== undefined) data.email = body.email;
    if (body.name !== undefined) data.name = body.name;
    if (body.roleId !== undefined) data.roleId = body.roleId;
    if (body.status !== undefined) data.status = body.status;
    if (body.password) data.passwordHash = await argon2.hash(body.password);
    return this.prisma.user.update({ where: { id }, data, include: { role: true } });
  }

  async approve(id: string, roleId?: string) {
    const data: any = { status: 'ACTIVE' };
    if (roleId) data.roleId = roleId;
    return this.prisma.user.update({ where: { id }, data, include: { role: true } });
  }

  async reject(id: string) {
    return this.prisma.user.update({ where: { id }, data: { status: 'REJECTED' } as any, include: { role: true } });
  }

  delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
