import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list() {
    return this.clients.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.clients.get(id);
  }

  @Post()
  create(@Body() body: { name: string; contact?: string; projects_linked_json?: any }) {
    return this.clients.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; contact?: string; projects_linked_json?: any }>,
  ) {
    return this.clients.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.clients.delete(id);
  }
}
