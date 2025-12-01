import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';
import { ManpowerRecordsService } from './manpower-records.service';
import { ManpowerRecordsController } from './manpower-records.controller';

@Module({
  imports: [PrismaModule, SystemLogsModule],
  providers: [ManpowerRecordsService],
  controllers: [ManpowerRecordsController],
})
export class ManpowerRecordsModule {}
