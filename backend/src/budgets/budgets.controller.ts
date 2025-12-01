import { BadRequestException, Body, Controller, Delete, Get, Header, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { BudgetsService } from './budgets.service';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'FINANCE_MANAGER')
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async list(
    @Query('projectId') projectId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
    @Query('export') exportFmt?: string,
  ) {
    const page = Math.max(1, Number(pageStr) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(pageSizeStr) || 20));
    const filter = {
      projectId,
      dateFrom: dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? new Date(dateFrom) : undefined,
      dateTo: dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? new Date(dateTo) : undefined,
      search: (search || '').trim() || undefined,
      page,
      pageSize,
    } as const;
    if (exportFmt === 'csv') {
      const { rows } = await this.budgets.list(filter);
      const csv = this.budgets.toCsv(rows as any);
      return csv;
    }
    return this.budgets.list(filter);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.budgets.get(id);
  }

  @Post()
  create(@Body() body: { projectId: string; periodStart: string; periodEnd: string; amount: number; spent?: number; category?: string }) {
    const data: any = { ...body, periodStart: new Date(body.periodStart), periodEnd: new Date(body.periodEnd) };
    return this.budgets.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<{ periodStart: string; periodEnd: string; amount: number; spent: number; category?: string }>) {
    const data: any = { ...body };
    if (body.periodStart) data.periodStart = new Date(body.periodStart);
    if (body.periodEnd) data.periodEnd = new Date(body.periodEnd);
    return this.budgets.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.budgets.delete(id);
  }

  @Post('bulk')
  async bulkCreate(@Body() body: Array<{ projectId: string; periodStart: string; periodEnd: string; amount: number; spent?: number; category?: string }>) {
    if (!Array.isArray(body)) throw new BadRequestException('Array body required');
    const rows = body.map((b) => ({
      projectId: b.projectId,
      periodStart: new Date(b.periodStart),
      periodEnd: new Date(b.periodEnd),
      amount: b.amount,
      spent: b.spent || 0,
      category: b.category || undefined,
    }));
    return this.budgets.bulkCreate(rows as any);
  }
}
