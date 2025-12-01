import { Controller, Get, Res, UseGuards } from '@nestjs/common';
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
}
