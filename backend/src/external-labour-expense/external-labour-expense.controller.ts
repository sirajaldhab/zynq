import { Body, Controller, Get, Post, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ExternalLabourExpenseService } from './external-labour-expense.service';

@UseGuards(JwtAuthGuard)
@Controller('external-labour-expense')
export class ExternalLabourExpenseController {
  constructor(private readonly svc: ExternalLabourExpenseService) {}

  @Get()
  list(
    @Query('vendorId') vendorId?: string,
    @Query('monthFrom') monthFrom?: string,
    @Query('monthTo') monthTo?: string,
  ) {
    const mf = monthFrom ? new Date(monthFrom) : undefined;
    const mt = monthTo ? new Date(monthTo) : undefined;
    return this.svc.list({ vendorId, monthFrom: mf, monthTo: mt });
  }

  @Post('upsert')
  upsert(
    @Body()
    body: {
      vendorId: string;
      month: string;
      totalLabour: number;
      total: number;
      paidAmount: number;
      notes?: string;
    },
    @Req() req: any,
  ) {
    return this.svc.upsert(body, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }
}
