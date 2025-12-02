import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'node:crypto';
import { RegisterDto } from './dto/register.dto';
import { SignupPendingDto } from './dto/signup-pending.dto';
import { LogoutDto } from './dto/logout.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        status: true,
        roleId: true,
        name: true,
        role: { select: { name: true } },
      },
    });
    this.logger.log(`Login attempt for ${email}`);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    if (user.status === 'PENDING_APPROVAL') throw new UnauthorizedException('Your account is waiting for admin approval.');
    if (user.status && user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const roleName = user.role?.name || (await this.prisma.role.findUnique({ where: { id: user.roleId } }))?.name;
    const payload = { sub: user.id, email: user.email, role: roleName } as any;
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });
    return { accessToken, refreshToken, role: roleName, userId: user.id, name: user.name };
  }

  async logout(token: string, requesterId?: string) {
    if (!token) return { ok: true };
    const existing = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!existing) return { ok: true };
    if (requesterId && existing.userId !== requesterId) {
      throw new UnauthorizedException('Cannot revoke tokens for another user');
    }
    await this.prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async refresh(oldToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: oldToken } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date())
      throw new UnauthorizedException('Invalid refresh token');

    // rotate
    await this.prisma.refreshToken.update({
      where: { token: oldToken },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      include: { role: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');

    const roleName = user.role?.name || (await this.prisma.role.findUnique({ where: { id: user.roleId } }))?.name;
    const payload = { sub: user.id, email: user.email, role: roleName } as any;
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    await this.prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    return { accessToken, refreshToken, role: roleName, userId: user.id, name: user.name };
  }

  async register(params: RegisterDto) {
    const { email, name, password, roleName } = params;
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('This email is already registered.');
    let role = await this.prisma.role.findFirst({ where: { name: roleName || 'STAFF' } });
    if (!role) {
      role = await this.prisma.role.findFirst({ where: { name: 'EMPLOYEE' } });
    }
    const passwordHash = await argon2.hash(password);
    const rn = (role?.name || '').toUpperCase();
    const isAdmin = rn === 'ADMIN' || rn === 'GM' || rn === 'MANAGER' || rn === 'TEAM LEADER';
    const status = isAdmin ? 'ACTIVE' : 'PENDING_APPROVAL';
    const user = await this.prisma.user.create({ data: { email, name, passwordHash, roleId: role?.id, status } as any });
    if (!isAdmin) {
      return { ok: true, pending: true } as any;
    }
    const payload = { sub: user.id, email: user.email, role: role?.name || 'EMPLOYEE' } as any;
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    await this.prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });
    return { accessToken, refreshToken, role: role?.name || 'EMPLOYEE', userId: user.id, name: user.name };
  }

  async signupPending(params: SignupPendingDto) {
    const { email, name, password } = params;
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('This email is already registered.');
    const role = await this.prisma.role.findFirst({ where: { name: 'EMPLOYEE' } });
    const passwordHash = await argon2.hash(password);
    await this.prisma.user.create({ data: { email, name, passwordHash, roleId: role?.id, status: 'PENDING' } as any });
    return { ok: true };
  }

  async forgotPassword(email: string) {
    if (!email) return { ok: true };
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        return { ok: true };
      }
      // TODO: integrate with actual mailer/token system
      this.logger.log(`Forgot password requested for ${email}`);
      return { ok: true };
    } catch (err) {
      this.logger.error('Forgot-password error', err as Error);
      return { ok: true };
    }
  }
}
