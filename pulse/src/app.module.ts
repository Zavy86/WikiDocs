import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppSchedules } from './app.schedules';
import { AppService } from './app.service';

@Module({
  imports: [
    ScheduleModule.forRoot()
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppSchedules,
    AppService
  ],
})
export class AppModule {}
