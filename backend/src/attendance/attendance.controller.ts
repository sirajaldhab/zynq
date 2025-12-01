import { Controller, Get, Query, UseGuards, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { AttendanceService } from './attendance.service';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'HR_MANAGER')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.attendance.list({
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
    return this.attendance.get(id, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Post()
  async create(
    @Body()
    body: {
      employeeId: string;
      emiratesId?: string;
      check_in: string;
      check_out?: string;
      status?: string;
      location?: string;
      approvedBy?: string;
      otHours?: number;
      signature?: string;
    },
    @Req() req: any,
  ) {
    return this.attendance.create(body, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    data: Partial<{
      check_in: string;
      check_out?: string;
      status?: string;
      location?: string;
      approvedBy?: string;
      otHours?: number;
      signature?: string;
    }>,
    @Req() req: any,
  ) {
    return this.attendance.update(id, data, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.attendance.delete(id, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }
}
