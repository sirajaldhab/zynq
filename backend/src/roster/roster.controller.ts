import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RosterService } from './roster.service';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'HR_MANAGER')
@Controller('roster')
export class RosterController {
  constructor(private readonly roster: RosterService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('shift') shift?: string,
  ) {
    return this.roster.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search: search || undefined,
      shift: shift || undefined,
    });
  }
}
