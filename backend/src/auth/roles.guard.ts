import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, AppRole } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // no role restriction
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string; email: string; role?: AppRole } | undefined;
    try { console.log('[RolesGuard]', { requiredRoles, userRole: user?.role }); } catch {}
    if (!user || !user.role) return false;
    const r = (user.role as string).toUpperCase();
    if (r === 'ADMIN' || r === 'GM' || r === 'MANAGER' || r === 'TEAM LEADER') return true; // ADMIN, GM, MANAGER, TEAM LEADER always allowed
    return requiredRoles.includes(user.role as AppRole);
  }
}
