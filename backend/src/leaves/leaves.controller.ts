import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { LeavesService } from './leaves.service';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'HR_MANAGER')
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leaves: LeavesService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.leaves.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status: status || undefined,
      employeeId: employeeId || undefined,
      start: start ? new Date(start) : undefined,
      end: end ? new Date(end) : undefined,
    });
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: any) {
    return this.leaves.get(id, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Post()
  create(
    @Body()
    body: { employeeId: string; start_date: string; end_date: string; type: string; status?: string },
    @Req() req: any,
  ) {
    return this.leaves.create(body, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ start_date: string; end_date: string; type: string; status: string }>,
    @Req() req: any,
  ) {
    return this.leaves.update(id, body, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.leaves.delete(id, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }
}
