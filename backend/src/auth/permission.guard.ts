import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSION_KEY } from './permission.decorator';
import { parsePermissions, resolvePermission } from './permission.util';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const key = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!key) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId?: string; role?: string } | undefined;
    if (!user?.userId) throw new ForbiddenException('Not authenticated');

    const tokenRole = (user.role || '').toUpperCase();
    if (tokenRole === 'ADMIN' || tokenRole === 'GM' || tokenRole === 'MANAGER' || tokenRole === 'TEAM LEADER') return true;

    const dbUser = await this.prisma.user.findUnique({ where: { id: user.userId }, include: { role: true } });
    if (!dbUser?.role) throw new ForbiddenException('Role not found');

    const roleName = (dbUser.role.name || '').toUpperCase();
    if (roleName === 'ADMIN' || roleName === 'GM' || roleName === 'MANAGER' || roleName === 'TEAM LEADER') return true;

    const perms = parsePermissions(dbUser.role.permissionsJson || '{}');
    const ok = resolvePermission(perms, key);
    if (!ok) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
