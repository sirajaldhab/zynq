import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { SystemLogsService } from './system-logs.service';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
@Controller('system-logs')
export class SystemLogsController {
  constructor(private readonly logs: SystemLogsService) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('level') level?: string,
  ) {
    return this.logs.list({ page: Number(page), pageSize: Number(pageSize), level });
  }
}
