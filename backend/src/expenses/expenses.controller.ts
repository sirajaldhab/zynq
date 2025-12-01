import { Body, Controller, Delete, Get, Header, Param, Post, Put, Query, UseGuards, BadRequestException, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { ExpensesService } from './expenses.service';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'FINANCE_MANAGER')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async list(
    @Query('projectId') projectId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
    @Query('export') exportFmt?: string,
    @Query('sortKey') sortKey?: string,
    @Query('sortDir') sortDir?: 'asc'|'desc',
  ) {
    const page = Math.max(1, Number(pageStr) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(pageSizeStr) || 20));
    const filter = {
      projectId,
      vendorId,
      dateFrom: dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? new Date(dateFrom) : undefined,
      dateTo: dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? new Date(dateTo) : undefined,
      search: (search || '').trim() || undefined,
      page,
      pageSize,
      sortKey: (sortKey || '').trim() || undefined,
      sortDir: sortDir === 'asc' || sortDir === 'desc' ? sortDir : undefined,
    } as const;
    const result = await this.expenses.list(filter);
    const filteredRows = result.rows.filter((r: any) => r.category !== 'General Expense');
    if (exportFmt === 'csv') {
      const csv = this.expenses.toCsv(filteredRows);
      return csv;
    }
    return { ...result, rows: filteredRows, total: filteredRows.length };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.expenses.get(id);
  }

  @Post()
  create(
    @Body() body: { projectId?: string; vendorId?: string; date: string; amount: number; category: string; note?: string },
    @Req() req: any,
  ) {
    const data: any = { ...body, date: new Date(body.date) };
    return this.expenses.create(data, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ projectId?: string; vendorId?: string; date: string; amount: number; category: string; note?: string }>,
    @Req() req: any,
  ) {
    const data: any = { ...body };
    if (body.date) data.date = new Date(body.date);
    return this.expenses.update(id, data, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.expenses.delete(id, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Post('bulk')
  async bulkCreate(
    @Body() body: Array<{ projectId?: string; vendorId?: string; date: string; amount: number; category: string; note?: string }>,
    @Req() req: any,
  ) {
    if (!Array.isArray(body)) throw new BadRequestException('Array body required');
    const rows = body.map((b) => ({ ...b, date: new Date(b.date) }));
    return this.expenses.bulkCreate(rows, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Get('aggregate/total')
  async aggregateTotal(
    @Query('projectId') projectId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
  ) {
    const filter = {
      projectId,
      vendorId,
      dateFrom: dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? new Date(dateFrom) : undefined,
      dateTo: dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? new Date(dateTo) : undefined,
      search: (search || '').trim() || undefined,
    } as const;
    return this.expenses.aggregateTotal(filter);
  }

  @Get('aggregate/unified-total')
  async aggregateUnifiedTotal(
    @Query('projectId') projectId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filter = {
      projectId,
      dateFrom: dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? new Date(dateFrom) : undefined,
      dateTo: dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? new Date(dateTo) : undefined,
    } as const;
    return this.expenses.aggregateUnifiedTotal(filter);
  }
}
