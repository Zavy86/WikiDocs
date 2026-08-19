import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { AppService } from 'src/app.service';

const VERSION_INTERVAL = ( 15 * 60 * 1000 );
const DAILY_METRICS_INTERVAL = ( 60 * 60 * 1000 );
const WEEKLY_METRICS_INTERVAL = ( 60 * 60 * 1000 );
const VERSION_URL = 'https://raw.githubusercontent.com/Zavy86/WikiDocs/main/VERSION';

@Injectable()
export class AppSchedules implements OnModuleInit {

  private readonly logger:Logger = new Logger(AppSchedules.name);

  private isRefreshing:boolean = false;

  constructor(
    private readonly appService:AppService
  ) {}

  public async onModuleInit():Promise<void> {
    await this.refreshLatestVersion();
    await this.refreshDailyMetrics();
    await this.refreshWeeklyMetrics();
  }

  @Interval(VERSION_INTERVAL)
  public async refreshLatestVersion():Promise<void> {
    if (this.isRefreshing) { return; }
    this.isRefreshing = true;
    try {
      const response:Response = await fetch(VERSION_URL);
      if ( ! response.ok) { throw new Error(`GitHub returned HTTP ${response.status}`); }
      const version:string = ( await response.text() ).trim();
      if ( ! version) { throw new Error('GitHub VERSION file is empty'); }
      this.appService.setVersion(version);
    } catch (error: unknown) {
      const message:string = ( error instanceof Error ? error.message : String(error) );
      this.logger.error(`Unable to refresh latest version: ${message}`);
    } finally {
      this.isRefreshing = false;
    }
  }

  @Interval(DAILY_METRICS_INTERVAL)
  public async refreshDailyMetrics():Promise<void> {
    try {
      await this.appService.aggregateDailyMetrics();
    } catch (error:unknown) {
      const message:string = ( error instanceof Error ? error.message : String(error) );
      this.logger.error(`Unable to refresh daily metrics: ${message}`);
    }
  }

  @Interval(WEEKLY_METRICS_INTERVAL)
  public async refreshWeeklyMetrics():Promise<void> {
    try {
      await this.appService.aggregateWeeklyMetrics();
    } catch (error:unknown) {
      const message:string = ( error instanceof Error ? error.message : String(error) );
      this.logger.error(`Unable to refresh weekly metrics: ${message}`);
    }
  }

}
