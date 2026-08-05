import { formatDate } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { SettingsService } from 'src/app/services/settings.service';

@Pipe({
  standalone: true,
  name: 'timezone',
  pure: false,
})
export class TimeZonePipe implements PipeTransform {

  private readonly settingsService:SettingsService = inject(SettingsService);

  public transform(value:Date | number | string | null | undefined, format:string):string | null {
    if ( value === null || value === undefined ) { return null; }
    const date:Date = value instanceof Date ? value : new Date(value);
    if ( Number.isNaN(date.getTime()) ) { return null; }
    return formatDate(date, format, 'en', this.settingsService.timezone());
  }

}
