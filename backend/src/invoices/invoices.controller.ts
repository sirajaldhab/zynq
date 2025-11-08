import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { InvoicesService } from './invoices.service';

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  list(@Query('projectId') projectId?: string, @Query('clientId') clientId?: string) {
    return this.invoices.list(projectId, clientId);
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
      invoice_date: string;
      due_date?: string;
      items_json: any;
      subtotal: number;
      vat: number;
      total: number;
      status?: string;
    },
  ) {
    const data = {
      ...body,
      invoice_date: new Date(body.invoice_date),
      due_date: body.due_date ? new Date(body.due_date) : undefined,
    } as any;
    return this.invoices.create(data);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      invoice_date: string;
      due_date?: string;
      items_json: any;
      subtotal: number;
      vat: number;
      total: number;
      status?: string;
    }>,
  ) {
    const data: any = { ...body };
    if (body.invoice_date) data.invoice_date = new Date(body.invoice_date);
    if (body.due_date) data.due_date = new Date(body.due_date);
    return this.invoices.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.invoices.delete(id);
  }

  @Get('reports/totals')
  totals(@Query('projectId') projectId?: string) {
    return this.invoices.totals(projectId);
  }
}
