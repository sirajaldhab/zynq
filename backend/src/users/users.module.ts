import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';

@Module({
  imports: [RealtimeModule, SystemLogsModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
