import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentCompaniesService } from './document-companies.service';
import { DocumentCompaniesController } from './document-companies.controller';
import { SystemLogsModule } from '../system-logs/system-logs.module';

@Module({
  imports: [PrismaModule, SystemLogsModule],
  providers: [DocumentCompaniesService],
  controllers: [DocumentCompaniesController],
})
export class DocumentCompaniesModule {}
