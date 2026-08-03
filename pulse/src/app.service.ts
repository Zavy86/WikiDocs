import { createHash } from 'node:crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {

  private readonly logger:Logger = new Logger('AppService');

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
      this.logger.debug(`Client pulse received from ${ this.hashIp(ip) } v${ version } ${ mode }`);
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
}
