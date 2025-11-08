import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Query('companyId') companyId?: string) {
    return this.projects.list(companyId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.projects.get(id);
  }

  @Post()
  create(@Body() body: { companyId: string; name: string; main_contractor?: string; consultant?: string; project_manager_id?: string; plots_json?: any; start_date?: string; end_date?: string; status?: string; }) {
    const data = {
      ...body,
      start_date: body.start_date ? new Date(body.start_date) : undefined,
      end_date: body.end_date ? new Date(body.end_date) : undefined,
    } as any;
    return this.projects.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<{ name: string; main_contractor?: string; consultant?: string; project_manager_id?: string; plots_json?: any; start_date?: string; end_date?: string; status?: string; }>) {
    const data: any = { ...body };
    if (body.start_date) data.start_date = new Date(body.start_date);
    if (body.end_date) data.end_date = new Date(body.end_date);
    return this.projects.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.projects.delete(id);
  }
}
