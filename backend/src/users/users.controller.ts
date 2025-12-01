import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
@Roles('ADMIN','HR_MANAGER','FINANCE_MANAGER','PROJECT_MANAGER','MANAGER','ACCOUNTANT')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@Req() req: any) {
    const userId = req.user?.userId;
    return this.users.findById(userId);
  }

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.users.list({ page: Number(page), pageSize: Number(pageSize), search, role, status });
  }

  @Get('pending')
  @Roles('ADMIN','HR_MANAGER')
  pending(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.users.list({ page: Number(page), pageSize: Number(pageSize), status: 'PENDING_APPROVAL' });
  }

  @Post()
  @Roles('ADMIN')
  create(
    @Body()
    body: { email: string; name: string; password?: string; roleId: string; status?: string },
  ) {
    return this.users.create(body);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ email: string; name: string; roleId: string; status: string; password?: string }>,
  ) {
    return this.users.update(id, body);
  }

  @Patch(':id/approve')
  @Roles('ADMIN','HR_MANAGER')
  approve(
    @Param('id') id: string,
    @Body() body: { roleId?: string },
  ) {
    return this.users.approve(id, body?.roleId);
  }

  @Patch(':id/reject')
  @Roles('ADMIN','HR_MANAGER')
  reject(@Param('id') id: string) {
    return this.users.reject(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.users.delete(id);
  }
}
