import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';
import { SiteDaySalariesService } from './site-day-salaries.service';
import { SiteDaySalariesController } from './site-day-salaries.controller';

@Module({
  imports: [PrismaModule, SystemLogsModule],
  providers: [SiteDaySalariesService],
  controllers: [SiteDaySalariesController],
})
export class SiteDaySalariesModule {}
