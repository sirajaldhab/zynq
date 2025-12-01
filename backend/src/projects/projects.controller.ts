import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'PROJECT_MANAGER')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  async list(
    @Query('companyId') companyId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('contractor') contractor?: string,
    @Query('manager') manager?: string,
    @Query('client') client?: string,
    @Query('site') site?: string,
    @Query('type') type?: 'MAIN' | 'SUB',
  ) {
    const p = page ? parseInt(page, 10) : undefined;
    const ps = pageSize ? parseInt(pageSize, 10) : undefined;
    const { data, total } = await this.projects.list({ companyId, page: p, pageSize: ps, search, contractor, manager, client, site, type });
    return { data, total };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.projects.get(id);
  }

  @Post()
  create(
    @Body()
    body: { companyId?: string; name: string; main_contractor?: string; consultant?: string; project_manager_id?: string; plots_json?: any; start_date?: string; end_date?: string; status?: string; parentId?: string; clientId?: string; clientName?: string; site?: string },
    @Req() req: any,
  ) {
    const data = {
      ...body,
      start_date: body.start_date ? new Date(body.start_date) : undefined,
      end_date: body.end_date ? new Date(body.end_date) : undefined,
    } as any;
    return this.projects.create(data, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{ name: string; main_contractor?: string; consultant?: string; project_manager_id?: string; plots_json?: any; start_date?: string; end_date?: string; status?: string; parentId?: string | null; clientId?: string | null; site?: string | null }>,
    @Req() req: any,
  ) {
    const data: any = { ...body };
    if (body.start_date) data.start_date = new Date(body.start_date);
    if (body.end_date) data.end_date = new Date(body.end_date);
    return this.projects.update(id, data, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.projects.delete(id, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }
}
