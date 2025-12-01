import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Query, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { PayrollService } from './payroll.service';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'HR_MANAGER')
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('employeeId') employeeId?: string,
    @Query('month') month?: string,
  ) {
    return this.payroll.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      employeeId: employeeId || undefined,
      month: month ? new Date(month) : undefined,
    });
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: any) {
    return this.payroll.get(id, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Post()
  create(
    @Body()
    body: { employeeId: string; month: string; gross: number; net: number; deductions_json?: any },
    @Req() req: any,
  ) {
    return this.payroll.create(body, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ month: string; gross: number; net: number; deductions_json?: any }>,
    @Req() req: any,
  ) {
    return this.payroll.update(id, body, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.payroll.delete(id, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }
}
