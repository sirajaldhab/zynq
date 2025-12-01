import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesService } from './roles.service';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  list() {
    return this.roles.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.roles.get(id);
  }

  @Post()
  create(@Body() body: { name: string; description?: string; status?: string; permissionsJson?: string; baseRoleName?: string }) {
    return this.roles.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<{ name: string; description: string; status: string; permissionsJson: string }>) {
    return this.roles.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.roles.delete(id);
  }
}
