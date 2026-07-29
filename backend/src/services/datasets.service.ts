import { Stats } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { plainToInstance } from "class-transformer";

@Injectable()
export abstract class DatasetsService {

  private readonly datasetLogger:Logger = new Logger('DatasetsService');

  protected constructor(
    private readonly datasetPath:string
  ) {}

  private async checkIfDatasetFileExists(path:string):Promise<void> {
    const stats:Stats | null = await stat(path).catch(():null => null);
    if ( ! stats?.isFile() ) {
      this.datasetLogger.error(`Dataset file <${ path }> not found`);
      throw new InternalServerErrorException(`Dataset file <${ path }> not found`);
    }
  }

  protected async retrieveObjectFromDataset<T>(schema:new () => T):Promise<T> {
    const path:string = this.datasetPath;
    await this.checkIfDatasetFileExists(path);
    const raw:string = await readFile(path, 'utf-8');
    const parsed:unknown = JSON.parse(raw);
    const typed:T = plainToInstance(schema, parsed, { excludeExtraneousValues: true });
    this.datasetLogger.debug(`Object retrieved from <${ path }>`);
    return typed;
  }

  protected async storeObjectToDataset<T>(request:T, schema:new () => T):Promise<void> {
    const path:string = this.datasetPath;
    await this.checkIfDatasetFileExists(path);
    const typed:T = plainToInstance(schema, request, { excludeExtraneousValues: true });
    const parsed:string = JSON.stringify(typed, null, 2);
    await writeFile(path, `${ parsed }\n`, 'utf-8');
    this.datasetLogger.debug(`Object stored in <${ path }>`);
  }

  protected async retrieveArrayFromDataset<T>(schema:new () => T):Promise<T[]> {
    const path:string = this.datasetPath;
    await this.checkIfDatasetFileExists(path);
    const raw:string = await readFile(path, 'utf-8');
    const parsed:unknown = JSON.parse(raw);
    if ( ! Array.isArray(parsed) || parsed.some((entry:unknown):boolean => ( typeof entry !== 'object' || entry === null )) ) {
      this.datasetLogger.error(`Invalid dataset format in <${ path }>, expected array of objects`);
      throw new InternalServerErrorException('Invalid dataset format');
    }
    const typed:T[] = parsed.map((entry:object):T => plainToInstance(schema, entry, { excludeExtraneousValues: true }));
    this.datasetLogger.debug(`Array retrieved from <${ path }>`);
    return typed;
  }

  protected async storeArrayToDataset<T>(request:T[], schema:new () => T):Promise<void> {
    const path:string = this.datasetPath;
    await this.checkIfDatasetFileExists(path);
    const typed:T[] = plainToInstance(schema, request, { excludeExtraneousValues: true });
    const parsed:string = JSON.stringify(typed, null, 2);
    await writeFile(path, `${ parsed }\n`, 'utf-8');
    this.datasetLogger.debug(`Array stored in <${ path }>`);
  }

}
