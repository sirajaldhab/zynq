import { BadRequestException, Body, Controller, Delete, Get, Header, Param, Post, Put, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { InvoicesService } from './invoices.service';

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async list(
    @Query('projectId') projectId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
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
      projectId,
      clientId,
      status,
      dateFrom: dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? new Date(dateFrom) : undefined,
      dateTo: dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? new Date(dateTo) : undefined,
      search: (search || '').trim() || undefined,
      page,
      pageSize,
      sortKey,
      sortDir,
    } as const;
    if (exportFmt === 'csv') {
      const { rows } = await this.invoices.list(filter);
      const csv = this.invoices.toCsv(rows as any);
      return csv;
    }
    return this.invoices.list(filter);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.invoices.get(id);
  }

  @Post()
  create(
    @Body()
    body: {
      projectId: string;
      clientId: string;
      invoice_no?: string;
      invoice_date: string;
      due_date?: string;
      items_json: any;
      subtotal: number;
      vat: number;
      total: number;
      status?: string;
    },
    @Req() req: any,
  ) {
    const data = {
      ...body,
      invoice_date: new Date(body.invoice_date),
      due_date: body.due_date ? new Date(body.due_date) : undefined,
    } as any;
    return this.invoices.create(data, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      projectId?: string;
      invoice_no?: string;
      invoice_date: string;
      due_date?: string;
      items_json: any;
      subtotal: number;
      vat: number;
      total: number;
      status?: string;
    }>,
    @Req() req: any,
  ) {
    const data: any = { ...body };
    if (body.invoice_date) data.invoice_date = new Date(body.invoice_date);
    if (body.due_date) data.due_date = new Date(body.due_date);
    return this.invoices.update(id, data, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.invoices.delete(id, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Get('reports/totals')
  totals(@Query('projectId') projectId?: string) {
    return this.invoices.totals(projectId);
  }

  @Get('aggregate/received-total')
  receivedTotal(
    @Query('projectId') projectId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const params = {
      projectId,
      dateFrom: dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? new Date(dateFrom) : undefined,
      dateTo: dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? new Date(dateTo) : undefined,
    } as const;
    return this.invoices.receivedTotal(params);
  }

  @Post('bulk')
  async bulkCreate(
    @Body()
    body: Array<{ projectId: string; clientId: string; invoice_date: string; due_date?: string; items_json: any; subtotal: number; vat: number; total: number; status?: string }>,
    @Req() req: any,
  ) {
    if (!Array.isArray(body)) throw new BadRequestException('Array body required');
    const rows = body.map((b) => ({
      ...b,
      invoice_date: new Date(b.invoice_date),
      due_date: b.due_date ? new Date(b.due_date) : undefined,
    }));
    return this.invoices.bulkCreate(rows as any, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }
}
