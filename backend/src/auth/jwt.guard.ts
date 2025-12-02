import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector, private prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const parentResult = super.canActivate(context);
    const can = await this.resolveCanActivateResult(parentResult);
    const request = context.switchToHttp().getRequest();
    const user = request?.user;
    if (user?.userId) {
      const dbUser = await this.prisma.user.findUnique({ where: { id: user.userId }, select: { status: true } });
      if (!dbUser || dbUser.status !== 'ACTIVE') {
        throw new UnauthorizedException('Account is not active');
      }
    }
    return can;
  }

  private async resolveCanActivateResult(
    result: boolean | Promise<boolean> | Observable<boolean>,
  ): Promise<boolean> {
    if (result instanceof Observable) {
      return firstValueFrom(result);
    }
    return result;
  }
}
