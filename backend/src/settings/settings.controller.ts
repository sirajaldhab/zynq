import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { SettingsService } from './settings.service';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  list() {
    return this.settings.list();
  }

  @Put(':key')
  update(@Param('key') key: string, @Body() body: { value: string }) {
    return this.settings.update(key, body.value);
  }
}
