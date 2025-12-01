import { BadRequestException, Controller, Get, Param, Post, Body, Query, Delete, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ManpowerRecordsService } from './manpower-records.service';

@UseGuards(JwtAuthGuard)
@Controller('manpower-records')
export class ManpowerRecordsController {
  constructor(private readonly records: ManpowerRecordsService) {}

  @Get()
  list(
    @Query('projectId') projectId?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.records.list({ projectId, vendorId });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.records.get(id);
  }

  @Post()
  create(
    @Body()
    body: {
      projectId: string;
      vendorId: string;
      site: string;
      main_contractor?: string;
      totalLabour: number;
      dailyRate: number;
      total: number;
      date?: string;
    },
    @Req() req: any,
  ) {
    const totalLabour = Number(body.totalLabour);
    const dailyRate = Number(body.dailyRate);
    const total = Number(body.total);
    const data: any = {
      projectId: body.projectId,
      vendorId: body.vendorId,
      site: (body.site || '').trim(),
      main_contractor: body.main_contractor ?? undefined,
      totalLabour: Number.isFinite(totalLabour) ? totalLabour : undefined,
      dailyRate: Number.isFinite(dailyRate) ? dailyRate : undefined,
      total: Number.isFinite(total) ? total : undefined,
      date: body.date,
    };
    if (!data.projectId) throw new BadRequestException('projectId is required');
    if (!data.vendorId) throw new BadRequestException('vendorId is required');
    if (!data.site) throw new BadRequestException('site is required');
    if (data.totalLabour === undefined || data.totalLabour <= 0) throw new BadRequestException('totalLabour must be > 0');
    if (data.dailyRate === undefined || data.dailyRate <= 0) throw new BadRequestException('dailyRate must be > 0');
    if (data.total === undefined || data.total <= 0) throw new BadRequestException('total must be > 0');
    return this.records.create(data, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    }).catch((e) => {
      const msg = (e && (e.message || e.code)) || 'Create failed';
      throw new BadRequestException(msg);
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    if (!id) throw new BadRequestException('id is required');
    return this.records.remove(id, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    }).catch((e) => {
      const msg = (e && (e.message || e.code)) || 'Delete failed';
      throw new BadRequestException(msg);
    });
  }
}
