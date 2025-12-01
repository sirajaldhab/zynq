import { BadRequestException, Body, Controller, Delete, Get, Header, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async list(
    @Query('invoiceId') invoiceId?: string,
    @Query('expenseId') expenseId?: string,
    @Query('projectId') projectId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('method') method?: string,
    @Query('search') search?: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
    @Query('export') exportFmt?: string,
    @Query('sortKey') sortKey?: string,
    @Query('sortDir') sortDir?: 'asc' | 'desc',
  ) {
    const page = Math.max(1, Number(pageStr) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(pageSizeStr) || 20));
    const filter = {
      invoiceId,
      expenseId,
      projectId,
      dateFrom: dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? new Date(dateFrom) : undefined,
      dateTo: dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? new Date(dateTo) : undefined,
      method: (method || '').trim() || undefined,
      search: (search || '').trim() || undefined,
      page,
      pageSize,
      sortKey,
      sortDir,
    } as const;
    if (exportFmt === 'csv') {
      const { rows } = await this.payments.list(filter);
      const csv = this.payments.toCsv(rows);
      return csv;
    }
    return this.payments.list(filter);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.payments.get(id);
  }

  @Post()
  create(
    @Body() body: { invoiceId: string; amount: number; payment_date: string; method?: string; reference?: string; created_by?: string },
  ) {
    const data = {
      ...body,
      payment_date: new Date(body.payment_date),
    } as any;
    return this.payments.create(data);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ amount: number; payment_date: string; method?: string; reference?: string; created_by?: string }>,
  ) {
    const data: any = { ...body };
    if (body.payment_date) data.payment_date = new Date(body.payment_date);
    return this.payments.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.payments.delete(id);
  }

  @Post('bulk')
  async bulkCreate(
    @Body() body: Array<{ invoiceId?: string; expenseId?: string; projectId?: string; amount: number; payment_date: string; method?: string; reference?: string }>,
  ) {
    if (!Array.isArray(body)) throw new BadRequestException('Array body required');
    const rows = body.map((b) => ({
      invoiceId: b.invoiceId || null,
      expenseId: b.expenseId || null,
      projectId: b.projectId || null,
      amount: b.amount,
      payment_date: new Date(b.payment_date),
      method: b.method || null,
      reference: b.reference || null,
    }));
    return this.payments.bulkCreate(rows);
  }

  @Get('aggregate/total')
  async aggregateTotal(
    @Query('invoiceId') invoiceId?: string,
    @Query('expenseId') expenseId?: string,
    @Query('projectId') projectId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('method') method?: string,
    @Query('search') search?: string,
  ) {
    const filter = {
      invoiceId,
      expenseId,
      projectId,
      dateFrom: dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? new Date(dateFrom) : undefined,
      dateTo: dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? new Date(dateTo) : undefined,
      method: (method || '').trim() || undefined,
      search: (search || '').trim() || undefined,
    } as const;
    return this.payments.aggregateTotal(filter);
  }
}
