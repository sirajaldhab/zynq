import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get()
  list() {
    return this.vendors.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.vendors.get(id);
  }

  @Post()
  create(@Body() body: { name: string; contact?: string; bank_details_json?: any }) {
    return this.vendors.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; contact?: string; bank_details_json?: any }>,
  ) {
    return this.vendors.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.vendors.delete(id);
  }
}
