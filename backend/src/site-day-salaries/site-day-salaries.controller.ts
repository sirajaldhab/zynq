import { Body, Controller, Get, Post, BadRequestException, Req } from '@nestjs/common';
import { SiteDaySalariesService } from './site-day-salaries.service';

type UpsertDto = {
  id?: string;
  site: string;
  projectId?: string | null;
  daySalary: number;
};

@Controller('hr/site-day-salaries')
export class SiteDaySalariesController {
  constructor(private readonly service: SiteDaySalariesService) {}

  @Get()
  async getAll(@Req() req: any) {
    return this.service.findAll({
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Post()
  async upsert(@Body() body: UpsertDto, @Req() req: any) {
    if (!body.site || typeof body.daySalary !== 'number' || Number.isNaN(body.daySalary)) {
      throw new BadRequestException('site and numeric daySalary are required');
    }
    return this.service.upsert(body, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }
}
