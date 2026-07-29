import { Injectable, Logger } from '@nestjs/common';
import { EnvironmentService } from 'src/services/environment.service';
import { DatasetsService } from "src/services/datasets.service";
import { SettingsSchema } from "src/schemas";

@Injectable()
export class SettingsService extends DatasetsService {

 private readonly logger:Logger = new Logger('SettingsService');

 constructor(
   environmentService:EnvironmentService
 ) {
   super(environmentService.getSettingsPath());
 }

  public async retrieve():Promise<SettingsSchema> {
    const settings:SettingsSchema = await super.retrieveObjectFromDataset(SettingsSchema);
    this.logger.debug(`Settings\n${ JSON.stringify(settings, null, 2) }`);
    return settings;
  }

  public async store(request:SettingsSchema):Promise<void> {
    await super.storeObjectToDataset(request, SettingsSchema);
    this.logger.debug(`Settings successfully updated`);
  }

}
