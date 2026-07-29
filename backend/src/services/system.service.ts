import { address } from 'ip';
import { name as service, version } from '../../package.json';
import { createHmac } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { Stats } from "node:fs";
import { join } from "node:path";
import { BadRequestException, Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { EnvironmentService } from "src/services/environment.service";
import { AccountSchema, InformationSchema, InitializationSchema, SettingsSchema } from "src/schemas";

@Injectable()
export class SystemService {

  private readonly logger:Logger = new Logger('SystemService');

  constructor(
    private readonly environmentService:EnvironmentService
  ) {}

  private async checkIfIsInitialized():Promise<boolean> {
    void this.environmentService.getMode();
    const settingsStats:Stats | null = await stat(this.environmentService.getSettingsPath()).catch(():null => null);
    if ( ! settingsStats || ! settingsStats.isFile() ) { return false; }
    const accountsStats:Stats | null = await stat(this.environmentService.getAccountsPath()).catch(():null => null);
    if ( ! accountsStats || ! accountsStats.isFile() ) { return false; }
    return true;
  }

  public async health():Promise<void> {
    if ( ! await this.checkIfIsInitialized() ) {
      throw new NotImplementedException('System not initialized');
    }
    this.logger.debug(`System service health check passed`);
  }

  public async information():Promise<InformationSchema> {
    const information:InformationSchema = {
      mode: this.environmentService.getMode(),
      initialized: await this.checkIfIsInitialized(),
      service,
      version,
      host: address(),
      platform: process.platform,
      engine: process.version,
      pid: process.pid,
      uptime: Math.round(process.uptime()),
      memory: process.memoryUsage().heapTotal,
    };
    this.logger.debug(`Information:\n${ JSON.stringify(information, null, 2) }`);
    return information;
  }

  public async initialize(request:InitializationSchema):Promise<void> {
    if ( await this.checkIfIsInitialized() ) {
      this.logger.error(`System already initialized, initialization not allowed`);
      throw new BadRequestException('System already initialized');
    }
    const mode:'local' | 'private' | 'public' = this.environmentService.getMode();
    let password:null | string = null;
    if ( mode === 'local' ) {
      if ( request.password !== null ) {
        throw new BadRequestException('Password must be null in local mode');
      }
    } else {
      if ( request.password === null ) {
        throw new BadRequestException('Password is required when mode is private or public');
      }
      password = createHmac('sha256', this.environmentService.getSecret()).update(request.password).digest('hex');
    }
    this.logger.warn(`Initialize <${ this.environmentService.getSettingsPath() }>`);
    const settings:SettingsSchema = {
      title: request.title,
      subtitle: 'flat-file markdown wiki',
      owner: `${ request.firstname } ${ request.lastname }`,
      notice: `Copyright © ${ request.firstname } ${ request.lastname }`,
      privacy: null,
      localization: 'en',
      timezone: 'UTC',
      template: 'light',
      color: '#4caf50'
    };
    await writeFile(this.environmentService.getSettingsPath(), `${ JSON.stringify(settings, null, 2) }\n`, 'utf-8');
    this.logger.warn(`Initialize <${ this.environmentService.getAccountsPath() }>`);
    const account:AccountSchema = {
      role: 'administrator',
      account: request.account,
      firstname: request.firstname,
      lastname: request.lastname,
      password
    };
    await writeFile(this.environmentService.getAccountsPath(), `${ JSON.stringify([ account ], null, 2) }\n`, 'utf-8');
    this.logger.warn(`Initialize <${ this.environmentService.getPinnedPath() }>`);
    await writeFile(this.environmentService.getPinnedPath(), `${ JSON.stringify([], null, 2) }\n`, 'utf-8');
    this.logger.warn(`Initialize <${ this.environmentService.getDocumentContentPath('/') }>`);
    const template:string = await readFile(join(__dirname, '../index.md'), 'utf-8');
    const index:string = template
      .replace('{{timestamp}}', new Date().toISOString())
      .replace('{{author}}', `${ request.firstname } ${ request.lastname } <${ request.account }>`);
    await mkdir(this.environmentService.getTrashRoot(), { recursive: true });
    await mkdir(this.environmentService.getDocumentsRoot(), { recursive: true });
    await writeFile(this.environmentService.getDocumentContentPath('/'), `${ index }`, 'utf-8');
  }

}
