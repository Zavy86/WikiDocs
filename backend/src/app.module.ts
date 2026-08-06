import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from "src/app.controller";
import { AppGuard } from "src/app.guard";
import { AccountsService, DocumentService, EnvironmentService, PinnedService, ReleaseService, SearchService, SettingsService, SystemService, SyncService } from "src/services";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    JwtModule
  ],
  controllers: [
    AppController
  ],
  providers: [
    AccountsService,
    DocumentService,
    EnvironmentService,
    PinnedService,
    ReleaseService,
    SearchService,
    SettingsService,
    SystemService,
    SyncService,
    { provide: APP_GUARD, useClass: AppGuard }
  ]
})
export class AppModule {}
