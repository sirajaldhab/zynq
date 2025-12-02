import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { ActivityGateway } from '../realtime/activity.gateway';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly userSelect = {
    id: true,
    email: true,
    name: true,
    status: true,
    roleId: true,
    role: { select: { id: true, name: true } },
    createdAt: true,
  } as const;

  constructor(private prisma: PrismaService, private activityGateway: ActivityGateway) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async list(params: { page: number; pageSize: number; search?: string; role?: string; status?: string }) {
    const page = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
    const rawPageSize = Number.isFinite(params.pageSize) && params.pageSize > 0 ? Math.floor(params.pageSize) : 20;
    const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
    const where: any = {};
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const roleFilter = params.role && params.role !== 'All' ? params.role : undefined;
    if (roleFilter) where.roleId = roleFilter;
    if (params.status && params.status !== 'All') where.status = params.status;

    const skip = (page - 1) * pageSize;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: this.userSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
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
    this.logger.log(`Creating user ${body.email}`);
    return this.prisma.user.create({ data, select: this.userSelect });
  }

  async update(
    id: string,
    body: Partial<{ email: string; name: string; roleId: string; status: string; password?: string }>,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    const data: any = {};
    if (body.email !== undefined) data.email = body.email;
    if (body.name !== undefined) data.name = body.name;
    if (body.roleId !== undefined) data.roleId = body.roleId;
    if (body.status !== undefined) data.status = body.status;
    if (body.password) data.passwordHash = await argon2.hash(body.password);

    const statusChanged = body.status !== undefined && body.status !== existing.status;
    const passwordChanged = Boolean(body.password);

    const updated = await this.prisma.user.update({ where: { id }, data, select: this.userSelect });

    if (passwordChanged) {
      await this.forceLogout(updated.id, 'Password changed by admin');
    }

    if (statusChanged) {
      const reason = updated.status !== 'ACTIVE' ? `Account ${updated.status?.toLowerCase()} by admin` : undefined;
      await this.forceLogout(updated.id, reason);
    }

    return updated;
  }

  async approve(id: string, roleId?: string) {
    const data: any = { status: 'ACTIVE' };
    if (roleId) data.roleId = roleId;
    const updated = await this.prisma.user.update({ where: { id }, data, select: this.userSelect });
    await this.forceLogout(updated.id, 'Account activated by admin');
    return updated;
  }

  private async revokeSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async forceLogout(userId: string, reason?: string) {
    await this.revokeSessions(userId);
    if (reason) {
      this.activityGateway.broadcast('user.forceLogout', {
        userId,
        reason,
      });
    }
  }

  async reject(id: string) {
    const updated = await this.prisma.user.update({ where: { id }, data: { status: 'REJECTED' } as any, select: this.userSelect });
    await this.forceLogout(updated.id, 'Account rejected by admin');
    return updated;
  }

  async delete(id: string) {
    await this.forceLogout(id, 'Account deleted by admin');
    return this.prisma.user.delete({ where: { id }, select: this.userSelect });
  }
}
