import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { ProjectExtrasService } from './project-extras.service';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'PROJECT_MANAGER')
@Controller('project-extras')
export class ProjectExtrasController {
  constructor(private readonly extras: ProjectExtrasService) {}

  @Get(':projectId')
  async getByProject(@Param('projectId') projectId: string) {
    const extra = await this.extras.findByProjectId(projectId);
    if (!extra) return null;
    return {
      id: extra.id,
      projectId: extra.projectId,
      otherText: extra.otherText ?? null,
    };
  }

  @Post()
  async save(@Body() body: { projectId: string; otherText?: string }) {
    const { projectId, otherText = '' } = body || {};
    if (!projectId) {
      throw new Error('projectId is required');
    }

    const extra = await this.extras.upsertForProject(projectId, otherText);
    return {
      id: extra.id,
      projectId: extra.projectId,
      otherText: extra.otherText ?? null,
    };
  }
}
