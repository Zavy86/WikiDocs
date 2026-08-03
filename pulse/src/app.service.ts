import { createHash } from 'node:crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client';

@Injectable()
export class AppService {

  private readonly logger:Logger = new Logger('AppService');

  private readonly prisma:PrismaClient = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: 'file:./data/pulse.db' }),
  });

  private version:string = '0.0.0';

  public setVersion(version:string):void {
    if (version === this.version) { return; }
    this.logger.log(`Latest version updated to: ${version}`);
    this.version = version;
  }

  public latest(ip:string, version?:string, mode?:string): string {
    this.validateVersion(version);
    this.validateMode(mode);
    if (version && mode) {
      const clientHash:string = this.hashIp(ip);
      this.logger.debug(`Client pulse received from ${ clientHash } v${ version } ${ mode }`);
      void this.recordClient(clientHash, version, mode).catch((error:unknown):void => {
        const message:string = ( error instanceof Error ? error.message : String(error) );
        this.logger.error(`Unable to record client pulse: ${ message }`);
      });
    }
    return this.version;
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
    const lastSeenAt:Date = new Date();
    await this.prisma.client.upsert({
      where: { clientHash },
      create: { clientHash, appVersion, configMode, lastSeenAt },
      update: { appVersion, configMode, lastSeenAt },
    });
  }

}
