import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { EmployeesService } from './employees.service';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'HR_MANAGER')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.employees.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search: search || undefined,
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.employees.get(id);
  }

  @Post()
  create(
    @Body()
    body: {
      company: string;
      employeeName: string;
      dateOfJoining: string;
      emiratesId: string;
      labourCardNo?: string;
      mobileNo: string;
      bankAccountNo?: string;
      salary: number;
      status: string;
      userId?: string | null;
      employment_details_json?: any;
    },
  ) {
    return this.employees.create(body);
  }

  @Post('with-user')
  createWithUser(
    @Body()
    body: {
      email: string;
      name: string;
      password: string;
      roleId: string;
      employment_details_json?: any;
    }
  ) {
    return this.employees.createWithUser(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      dateOfJoining: string;
      employeeName: string;
      labourCardNo: string;
      mobileNo: string;
      bankAccountNo: string;
      salary: number;
      status: string;
    }>,
  ) {
    return this.employees.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.employees.delete(id);
  }
}
