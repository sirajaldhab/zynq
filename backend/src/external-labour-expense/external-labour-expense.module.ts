import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';
import { ExternalLabourExpenseService } from './external-labour-expense.service';
import { ExternalLabourExpenseController } from './external-labour-expense.controller';

@Module({
  imports: [PrismaModule, SystemLogsModule],
  providers: [ExternalLabourExpenseService],
  controllers: [ExternalLabourExpenseController],
})
export class ExternalLabourExpenseModule {}
