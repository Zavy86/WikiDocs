import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {

  private readonly logger:Logger = new Logger('AppService');

  private version:string = '0.0.0';

  public setVersion(version:string):void {
    if (version === this.version) { return; }
    this.logger.log(`Latest version updated to: ${version}`);
    this.version = version;
  }

  public latest():string {
    return this.version;
  }

}
