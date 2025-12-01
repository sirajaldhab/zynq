import { Module } from '@nestjs/common';
import { SystemBackupService } from './system-backup.service';
import { SystemBackupController } from './system-backup.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SystemBackupService],
  controllers: [SystemBackupController],
})
export class SystemBackupModule {}
