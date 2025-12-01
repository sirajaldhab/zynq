import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    try { console.log('[Auth] login attempt', { email, found: !!user }); } catch {}
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, password);
    try { console.log('[Auth] password verify', { email, ok }); } catch {}
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    if (user.status === 'PENDING_APPROVAL') throw new UnauthorizedException('Your account is waiting for admin approval.');
    if (user.status && user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const roleName = (await this.prisma.role.findUnique({ where: { id: user.roleId } }))?.name;
    const payload = { sub: user.id, email: user.email, role: roleName } as any;
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev-secret',
      expiresIn: '15m',
    });
    const refreshToken = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });
    return { accessToken, refreshToken, role: roleName, userId: user.id, name: user.name };
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

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const roleName = (await this.prisma.role.findUnique({ where: { id: user.roleId } }))?.name;
    const payload = { sub: user.id, email: user.email, role: roleName } as any;
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev-secret',
      expiresIn: '15m',
    });
    const refreshToken = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    await this.prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    return { accessToken, refreshToken, role: roleName, userId: user.id, name: user.name };
  }

  async register(params: { email: string; name: string; password: string; roleName?: string }) {
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
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev-secret',
      expiresIn: '15m',
    });
    const refreshToken = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    await this.prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });
    return { accessToken, refreshToken, role: role?.name || 'EMPLOYEE', userId: user.id, name: user.name };
  }

  async signupPending(params: { email: string; name: string; password: string }) {
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
      console.log('[Auth] forgot-password request', { email });
      return { ok: true };
    } catch (err) {
      console.error('[Auth] forgot-password error', err);
      return { ok: true };
    }
  }
}
