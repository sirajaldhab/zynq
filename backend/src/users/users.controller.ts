import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards, Patch } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto, UpdateUserDto, ListUsersQueryDto } from './dto';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { AuthenticatedRequest } from '../auth/authenticated-request';

@UseGuards(JwtAuthGuard)
@Controller('users')
@Roles('ADMIN','HR_MANAGER','FINANCE_MANAGER','PROJECT_MANAGER','MANAGER','ACCOUNTANT')
export class UsersController {
  constructor(private readonly users: UsersService, private readonly logs: SystemLogsService) {}

  @Get('me')
  async me(@Req() req: any) {
    const userId = req.user?.userId;
    return this.users.findById(userId);
  }

  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.users.list(query);
  }

  @Get('pending')
  @Roles('ADMIN','HR_MANAGER')
  pending(@Query() query: ListUsersQueryDto) {
    return this.users.list({ ...query, status: 'PENDING_APPROVAL' });
  }

  @Post()
  @Roles('ADMIN')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async create(@Body() body: CreateUserDto, @Req() req: AuthenticatedRequest) {
    const created = await this.users.create(body);
    this.logs
      .logActivity({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'created',
        entityType: 'User',
        entityId: created.id,
        entityName: created.name,
        extra: { targetEmail: created.email, roleId: created.roleId },
      })
      .catch(() => {});
    return created;
  }

  @Put(':id')
  @Roles('ADMIN')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async update(@Param('id') id: string, @Body() body: UpdateUserDto, @Req() req: AuthenticatedRequest) {
    const updated = await this.users.update(id, body);
    this.logs
      .logActivity({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'updated',
        entityType: 'User',
        entityId: updated.id,
        entityName: updated.name,
        extra: { targetEmail: updated.email, status: updated.status, roleId: updated.roleId },
      })
      .catch(() => {});
    return updated;
  }

  @Patch(':id/approve')
  @Roles('ADMIN','HR_MANAGER')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async approve(
    @Param('id') id: string,
    @Body() body: { roleId?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const approved = await this.users.approve(id, body?.roleId);
    this.logs
      .logActivity({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'approved',
        entityType: 'User',
        entityId: approved.id,
        entityName: approved.name,
        extra: { roleId: approved.roleId },
      })
      .catch(() => {});
    return approved;
  }

  @Patch(':id/reject')
  @Roles('ADMIN','HR_MANAGER')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async reject(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const rejected = await this.users.reject(id);
    this.logs
      .logActivity({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'rejected',
        entityType: 'User',
        entityId: rejected.id,
        entityName: rejected.name,
      })
      .catch(() => {});
    return rejected;
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const deleted = await this.users.delete(id);
    this.logs
      .logActivity({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'deleted',
        entityType: 'User',
        entityId: deleted.id,
        entityName: deleted.name,
        extra: { targetEmail: deleted.email },
      })
      .catch(() => {});
    return deleted;
  }
}
