import { Module } from '@nestjs/common';
import { GeneralExpensesController } from './general-expenses.controller';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [ExpensesModule],
  controllers: [GeneralExpensesController],
})
export class GeneralExpensesModule {}
