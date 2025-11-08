import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(@Query('invoiceId') invoiceId?: string) {
    return this.payments.list(invoiceId);
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
}
