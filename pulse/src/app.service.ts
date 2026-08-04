import { createHash } from 'node:crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client';
import { DailyMetricSchema, LatestSchema, StatsSchema, WeeklyMetricSchema } from './app.schemas';

@Injectable()
export class AppService {
  private readonly logger: Logger = new Logger('AppService');

  private readonly prisma: PrismaClient = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: 'file:./data/pulse.db' }),
  });

  private version: string = '0.0.0';

  public async latest(ip:string, version?:string, mode?:string):Promise<LatestSchema> {
    this.validateVersion(version);
    this.validateMode(mode);
    if (version && mode) {
      const clientHash: string = this.hashIp(ip);
      this.logger.debug(`Client pulse received from ${clientHash} v${version} ${mode}`);
      void this.recordClient(clientHash, version, mode).catch((error: unknown): void => {
        const message: string = error instanceof Error ? error.message : String(error);
        this.logger.error(`Unable to record client pulse: ${message}`);
      });
    }
    return { version: this.version };
  }

  public async stats():Promise<StatsSchema> {
    const startOfToday:Date = this.startOfDay(new Date());
    const dailyStart:Date = new Date(startOfToday);
    dailyStart.setUTCDate(dailyStart.getUTCDate() - 30);
    const dailyEnd:Date = new Date(startOfToday);
    dailyEnd.setUTCMilliseconds(dailyEnd.getUTCMilliseconds() - 1);
    const startOfCurrentWeek:Date = this.startOfWeek(startOfToday);
    const weeklyStart:Date = new Date(startOfCurrentWeek);
    weeklyStart.setUTCDate(weeklyStart.getUTCDate() - 54 * 7);
    const weeklyEnd:Date = new Date(startOfCurrentWeek);
    weeklyEnd.setUTCDate(weeklyEnd.getUTCDate() - 7);
    const [ dailyMetrics, weeklyMetrics ] = await Promise.all([
      this.prisma.dailyMetric.findMany({
        where: { date: { gte: dailyStart, lte: dailyEnd } },
        orderBy: [{ date: 'asc' }, { appVersion: 'asc' }, { configMode: 'asc' }],
      }),
      this.prisma.weeklyMetric.findMany({
        where: {
          yearWeek: {
            gte: this.yearWeek(weeklyStart),
            lte: this.yearWeek(weeklyEnd),
          },
        },
        orderBy: [{ yearWeek: 'asc' }, { appVersion: 'asc' }, { configMode: 'asc' }],
      })
    ]);
    return {
      daily: dailyMetrics.map((metric):DailyMetricSchema => ({
        date: metric.date.toISOString().slice(0, 10),
        version: metric.appVersion,
        mode: metric.configMode,
        count: metric.activeClientsCount,
      })),
      weekly: weeklyMetrics.map((metric):WeeklyMetricSchema => ({
        week: metric.yearWeek,
        version: metric.appVersion,
        mode: metric.configMode,
        count: metric.activeClientsCount,
      }))
    };
  }

  public setVersion(version:string):void {
    if (version === this.version) { return; }
    this.logger.log(`Latest version updated to: ${version}`);
    this.version = version;
  }

  public async aggregateDailyMetrics():Promise<void> {
    const date: Date = this.startOfDay(new Date());
    const endOfDay: Date = new Date(date);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
    endOfDay.setUTCMilliseconds(endOfDay.getUTCMilliseconds() - 1);
    const groups = await this.prisma.client.groupBy({
      by: ['configMode', 'appVersion'],
      where: { lastSeenAt: { gte: date, lte: endOfDay } },
      _count: { _all: true },
    });
    await this.prisma.$transaction(async (transaction): Promise<void> => {
      await transaction.dailyMetric.deleteMany({ where: { date } });
      for (const group of groups) {
        await transaction.dailyMetric.create({
          data: {
            date,
            configMode: group.configMode,
            appVersion: group.appVersion,
            activeClientsCount: group._count._all,
          },
        });
      }
    });
    this.logger.log(`Daily metrics refreshed: ${groups.length} groups`);
  }

  public async aggregateWeeklyMetrics():Promise<void> {
    const startOfWeek: Date = this.startOfWeek(new Date());
    const endOfWeek: Date = new Date(startOfWeek);
    endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 7);
    endOfWeek.setUTCMilliseconds(endOfWeek.getUTCMilliseconds() - 1);
    const groups = await this.prisma.client.groupBy({
      by: ['configMode', 'appVersion'],
      where: { lastSeenAt: { gte: startOfWeek, lte: endOfWeek } },
      _count: { _all: true },
    });
    const yearWeek: string = this.yearWeek(startOfWeek);
    await this.prisma.$transaction(async (transaction): Promise<void> => {
      await transaction.weeklyMetric.deleteMany({ where: { yearWeek } });
      for (const group of groups) {
        await transaction.weeklyMetric.create({
          data: {
            yearWeek,
            configMode: group.configMode,
            appVersion: group.appVersion,
            activeClientsCount: group._count._all,
          },
        });
      }
    });
    this.logger.log(`Weekly metrics refreshed: ${groups.length} groups`);
  }

  private hashIp(ip:string):string {
    return createHash('sha1').update(ip).digest('hex');
  }

  private validateVersion(version?:string):void {
    if (version !== undefined && ! /^\d+\.\d+\.\d+$/.test(version)) {
      throw new BadRequestException('Version must be a valid semantic version');
    }
  }

  private validateMode(mode?:string):void {
    if (mode !== undefined && mode !== 'local' && mode !== 'private' && mode !== 'public') {
      throw new BadRequestException('Mode must be local, private, or public');
    }
  }

  private async recordClient(clientHash:string, appVersion:string, configMode:string):Promise<void> {
    const lastSeenAt: Date = new Date();
    await this.prisma.client.upsert({
      where: { clientHash },
      create: { clientHash, appVersion, configMode, lastSeenAt },
      update: { appVersion, configMode, lastSeenAt },
    });
  }

  private startOfDay(date:Date):Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private startOfWeek(date:Date):Date {
    const startOfWeek:Date = this.startOfDay(date);
    const daysSinceMonday:number = (( startOfWeek.getUTCDay() + 6 ) % 7 );
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - daysSinceMonday);
    return startOfWeek;
  }

  private yearWeek(date:Date): string {
    const thursday:Date = new Date(date);
    thursday.setUTCDate(thursday.getUTCDate() + 3);
    const year:number = thursday.getUTCFullYear();
    const firstDayOfYear:Date = new Date(Date.UTC(year, 0, 1));
    const week:number = Math.ceil(((thursday.getTime() - firstDayOfYear.getTime()) / 86400000 + 1) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }
}
