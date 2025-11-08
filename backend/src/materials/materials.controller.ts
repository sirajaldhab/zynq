import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
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
  create(@Body() body: { projectId: string; invoice_date?: string; vendorId?: string; item_description: string; quantity: number; unit_price?: number; total: number; attachments?: any }) {
    const data: any = {
      ...body,
      invoice_date: body.invoice_date ? new Date(body.invoice_date) : undefined,
    };
    return this.materials.create(data);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ invoice_date?: string; vendorId?: string; item_description?: string; quantity?: number; unit_price?: number; total?: number; attachments?: any }>,
  ) {
    const data: any = { ...body };
    if (body.invoice_date) data.invoice_date = new Date(body.invoice_date);
    return this.materials.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.materials.delete(id);
  }

  // Bulk import stub (XLSX placeholder)
  @Post('bulk-import')
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(@UploadedFile() _file: any) {
    // TODO: parse XLSX and create materials
    return { status: 'accepted' };
  }
}
