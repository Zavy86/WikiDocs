import { version } from '../../package.json';
import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { EnvironmentService } from 'src/services/environment.service';
import { ReleaseSchema } from 'src/schemas';

const DEVELOPMENT_BACKEND_PORT:string = '3000';
const DEVELOPMENT_PULSE_URL:string = 'http://localhost:3001';
const PRODUCTION_PULSE_URL:string = 'https://pulse.wikidocs.app';
const RELEASE_INTERVAL:number = ( 8 * 60 * 60 * 1000 );

@Injectable()
export class ReleaseService implements OnModuleInit {
  private readonly logger:Logger = new Logger(ReleaseService.name);

  private latest:string = version;

  private refreshRequest:Promise<void> | null = null;

  constructor(private readonly environmentService:EnvironmentService) {}

  public onModuleInit():void {
    void this.refreshScheduled();
  }

  private refresh():Promise<void> {
    if (this.refreshRequest) {
      return this.refreshRequest;
    }
    this.refreshRequest = this.requestLatestRelease().finally(():void => {
      this.refreshRequest = null;
    });
    return this.refreshRequest;
  }

  private async requestLatestRelease():Promise<void> {
    const url:URL = new URL('/api/latest', this.getPulseUrl());
    url.searchParams.set('mode', this.environmentService.getMode());
    url.searchParams.set('version', version);
    const response:Response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Pulse returned HTTP ${response.status}`);
    }
    const payload:unknown = await response.json();
    if ( typeof payload !== 'object' || payload === null || typeof ( payload as { version?:unknown } ).version !== 'string' ) {
      throw new Error('Pulse returned an invalid latest release payload');
    }
    const latest:string = ( payload as { version:string } ).version.trim();
    if (!latest) {
      throw new Error('Pulse returned an empty latest release version');
    }
    if (latest !== this.latest) {
      this.latest = latest;
      this.logger.log(`Latest release updated from Pulse to <${ latest }>`);
    }
  }

  private getPulseUrl():string {
    return ( ( process.env.PORT ?? DEVELOPMENT_BACKEND_PORT ) === DEVELOPMENT_BACKEND_PORT ? DEVELOPMENT_PULSE_URL : PRODUCTION_PULSE_URL );
  }

  public async retrieve(force:boolean = false):Promise<ReleaseSchema> {
    if (force) {
      try {
        await this.refresh();
      } catch (error:unknown) {
        const message:string = ( error instanceof Error ? error.message : String(error) );
        throw new ServiceUnavailableException(`Unable to check for new versions: ${ message }`);
      }
    }
    return {
      current: version,
      latest: this.latest
    };
  }

  @Interval(RELEASE_INTERVAL)
  public async refreshScheduled():Promise<void> {
    try {
      await this.refresh();
    } catch (error:unknown) {
      const message:string = ( error instanceof Error ? error.message : String(error) );
      this.logger.error(`Unable to refresh latest release: ${ message }`);
    }
  }

}
