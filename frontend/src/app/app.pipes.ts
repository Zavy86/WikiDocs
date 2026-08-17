import { formatDate } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { LocalizationService } from 'src/app/services/localization.service';
import { SettingsService } from 'src/app/services/settings.service';
import { LocalizationParameters } from 'src/app/types';

@Pipe({
  standalone: true,
  name: 'localized',
  pure: false,
})
export class LocalizedPipe implements PipeTransform {

  private readonly localizationService:LocalizationService = inject(LocalizationService);

  public transform(code:string, parameters:LocalizationParameters = {}):string {
    return this.localizationService.getText(code, parameters);
  }

}

@Pipe({
  standalone: true,
  name: 'timezone',
  pure: false,
})
export class TimeZonePipe implements PipeTransform {

  private readonly localizationService:LocalizationService = inject(LocalizationService);
  private readonly settingsService:SettingsService = inject(SettingsService);

  public transform(value:Date | number | string | null | undefined, format:string):string | null {
    if ( value === null || value === undefined ) { return null; }
    const date:Date = value instanceof Date ? value : new Date(value);
    if ( Number.isNaN(date.getTime()) ) { return null; }
    return formatDate(date, format, this.localizationService.language(), this.settingsService.timezone());
  }

}
