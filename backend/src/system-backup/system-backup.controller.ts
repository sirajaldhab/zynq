import { Body, Controller, Get, Patch, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SystemBackupService } from './system-backup.service';

@Controller('system')
@UseGuards(JwtAuthGuard)
export class SystemBackupController {
  constructor(private readonly backup: SystemBackupService) {}

  @Get('backup')
  @Roles('ADMIN', 'GM', 'RECORDER')
  async downloadBackup(@Res() res: Response) {
    const { buffer, filename } = await this.backup.generateSystemBackupZip();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('backup/settings')
  @Roles('ADMIN', 'GM', 'RECORDER')
  async getBackupSettings() {
    return this.backup.getSettings();
  }

  @Patch('backup/settings')
  @Roles('ADMIN', 'GM')
  async updateBackupSettings(@Body() body: { emails?: string }) {
    return this.backup.updateSettings(body?.emails || '');
  }
}
