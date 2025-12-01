import { Module } from '@nestjs/common';
import { ExternalManpowerSummariesController } from './external-manpower-summaries.controller';

// External Manpower summaries module is now a no-op and kept only to
// satisfy existing imports. It registers no DB-related providers.
@Module({
  controllers: [ExternalManpowerSummariesController],
})
export class ExternalManpowerSummariesModule {}
