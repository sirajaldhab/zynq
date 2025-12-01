import { Module } from '@nestjs/common';
import { ProjectExtrasService } from './project-extras.service';
import { ProjectExtrasController } from './project-extras.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProjectExtrasService],
  controllers: [ProjectExtrasController],
})
export class ProjectExtrasModule {}
