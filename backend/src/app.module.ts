import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';
import { JwtAuthGuard } from './auth/jwt.guard';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { VendorsModule } from './vendors/vendors.module';
import { ClientsModule } from './clients/clients.module';
import { MaterialsModule } from './materials/materials.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { ActivityGateway } from './realtime/activity.gateway';
import { SyncModule } from './sync/sync.module';
import { ExpensesModule } from './expenses/expenses.module';
import { GeneralExpensesModule } from './general-expenses/general-expenses.module';
import { BudgetsModule } from './budgets/budgets.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SiteDaySalariesModule } from './site-day-salaries/site-day-salaries.module';
import { LeavesModule } from './leaves/leaves.module';
import { PayrollModule } from './payroll/payroll.module';
import { RosterModule } from './roster/roster.module';
import { RolesModule } from './roles/roles.module';
import { SystemLogsModule } from './system-logs/system-logs.module';
import { SettingsModule } from './settings/settings.module';
import { DocumentCompaniesModule } from './document-companies/document-companies.module';
import { ManpowerRecordsModule } from './manpower-records/manpower-records.module';
import { ExternalManpowerSummariesModule } from './external-manpower-summaries/external-manpower-summaries.module';
import { ExternalLabourExpenseModule } from './external-labour-expense/external-labour-expense.module';
import { ProjectExtrasModule } from './project-extras/project-extras.module';
import { SystemBackupModule } from './system-backup/system-backup.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    VendorsModule,
    ClientsModule,
    MaterialsModule,
    InvoicesModule,
    PaymentsModule,
    ExpensesModule,
    GeneralExpensesModule,
    BudgetsModule,
    EmployeesModule,
    AttendanceModule,
    SiteDaySalariesModule,
    LeavesModule,
    PayrollModule,
    RosterModule,
    RolesModule,
    SystemLogsModule,
    SettingsModule,
    DocumentCompaniesModule,
    SyncModule,
    ManpowerRecordsModule,
    ExternalManpowerSummariesModule,
    ExternalLabourExpenseModule,
    ProjectExtrasModule,
    SystemBackupModule,
  ],
  providers: [
    ActivityGateway,
    // Order matters: first authenticate, then authorize by role
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
