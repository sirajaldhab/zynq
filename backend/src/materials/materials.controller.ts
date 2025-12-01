import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors, BadRequestException, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { MaterialsService } from './materials.service';
import type { Express } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  @Get()
  list(@Query('projectId') projectId?: string) {
    return this.materials.list(projectId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.materials.get(id);
  }

  @Post()
  create(
    @Body()
    body: { projectId: string; invoice_date?: string; vendorId?: string; item_description: string; quantity: number; unit_price?: number; vat?: number; total: number; attachments?: any },
    @Req() req: any,
  ) {
    // Whitelist fields supported by the DB schema and ignore unsupported ones (e.g., 'vat')
    const q = Number(body.quantity);
    const up = body.unit_price !== undefined && body.unit_price !== null ? Number(body.unit_price) : undefined;
    const vt = body.vat !== undefined && body.vat !== null ? Number(body.vat) : undefined;
    const tt = Number(body.total);
    const iso = typeof body.invoice_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.invoice_date) ? body.invoice_date : undefined;
    const data: any = {
      projectId: body.projectId,
      invoice_date: iso ? new Date(iso) : undefined,
      vendorId: body.vendorId,
      item_description: body.item_description,
      quantity: Number.isFinite(q) ? q : undefined,
      unit_price: Number.isFinite(up as number) ? up : undefined,
      vat: Number.isFinite(vt as number) ? vt : undefined,
      total: Number.isFinite(tt) ? tt : undefined,
      attachments: body.attachments,
    };
    if (!data.projectId) throw new BadRequestException('projectId is required');
    if (!data.item_description) throw new BadRequestException('item_description is required');
    if (data.quantity === undefined) throw new BadRequestException('quantity is required and must be a number');
    if (data.total === undefined) throw new BadRequestException('total is required and must be a number');
    return this.materials.create(data, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    }).catch((e) => {
      const msg = (e && (e.message || e.code)) || 'Create failed';
      throw new BadRequestException(msg);
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{ invoice_date?: string; vendorId?: string; item_description?: string; quantity?: number; unit_price?: number; vat?: number; total?: number; attachments?: any }>,
    @Req() req: any,
  ) {
    // Whitelist fields and convert date
    const q = body.quantity !== undefined && body.quantity !== null ? Number(body.quantity) : undefined;
    const up = body.unit_price !== undefined && body.unit_price !== null ? Number(body.unit_price) : undefined;
    const vt = body.vat !== undefined && body.vat !== null ? Number(body.vat) : undefined;
    const tt = body.total !== undefined && body.total !== null ? Number(body.total) : undefined;
    const data: any = {
      vendorId: body.vendorId,
      item_description: body.item_description,
      quantity: Number.isFinite(q as number) ? q : undefined,
      unit_price: Number.isFinite(up as number) ? up : undefined,
      vat: Number.isFinite(vt as number) ? vt : undefined,
      total: Number.isFinite(tt as number) ? tt : undefined,
      attachments: body.attachments,
    };
    if (typeof body.invoice_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.invoice_date)) {
      data.invoice_date = new Date(body.invoice_date);
    }
    return this.materials.update(id, data, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    }).catch((e) => {
      const msg = (e && (e.message || e.code)) || 'Update failed';
      throw new BadRequestException(msg);
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.materials.delete(id, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  // Bulk import stub (XLSX placeholder)
  @Post('bulk-import')
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(@UploadedFile() _file: any) {
    // TODO: parse XLSX and create materials
    return { status: 'accepted' };
  }
}
