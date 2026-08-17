import { parse } from 'yaml';
import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, Signal } from '@angular/core';
import { LogsService } from 'src/app/services/logs.service';
import { SettingsService } from 'src/app/services/settings.service';
import { LocalizationParameters, SettingsType } from 'src/app/types';
import localizationEN from 'src/app/localizations/en.yml';

type LocalizationDictionary = Readonly<Record<string, string>>;
type LocalizationTree = Readonly<Record<string, unknown>>;

@Injectable({ providedIn: 'root' })
export class LocalizationService {

  private readonly document:Document = inject(DOCUMENT);
  private readonly logsService:LogsService = inject(LogsService);
  private readonly settingsService:SettingsService = inject(SettingsService);

  private readonly localizations:Readonly<Partial<Record<SettingsType['localization'], LocalizationDictionary>>> = {
    en: this.parseLocalization('en', localizationEN),
  };

  public readonly language:Signal<SettingsType['localization']> = computed(():SettingsType['localization'] => {
    return ( this.settingsService.settings()?.localization ?? 'en' );
  });

  public constructor() {
    effect(():void => {
      this.document.documentElement.lang = this.language();
    });
  }

  public getText(code:string, parameters:LocalizationParameters = {}):string {
    const value:string | undefined = this.localizations[ this.language() ]?.[ code ];
    if ( value === undefined ) {
      this.logsService.error(`[LocalizationService] localization code \`${ code }\` was not found for language \`${ this.language() }\``);
      return `{${ code }}`;
    }
    return value.replace(/\{([a-z0-9]+(?:-[a-z0-9]+)*)(?::([^{}]*))?}/g, (placeholder:string, name:string, defaultValue:string | undefined):string => {
      if ( Object.prototype.hasOwnProperty.call(parameters, name) ) { return String(parameters[ name ]); }
      if ( defaultValue !== undefined ) { return defaultValue; }
      this.logsService.error(`[LocalizationService] parameter \`${ name }\` was not provided for localization code \`${ code }\``);
      return placeholder;
    });
  }

  private parseLocalization(language:string, source:string):LocalizationDictionary {
    const parsed:unknown = parse(source);
    if ( ! this.isLocalizationTree(parsed) ) {
      throw new Error(`[LocalizationService] localization \`${ language }\` must contain a YAML object`);
    }
    const flattened:Record<string, string> = {};
    this.flattenLocalization(parsed, flattened, language);
    return flattened;
  }

  private flattenLocalization(tree:LocalizationTree, target:Record<string, string>, language:string, prefix:string = ''):void {
    for ( const [ key, value ] of Object.entries(tree) ) {
      if ( ! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) ) {
        throw new Error(`[LocalizationService] invalid localization key segment \`${ key }\` in language \`${ language }\``);
      }
      const code:string = prefix ? `${ prefix }.${ key }` : key;
      if ( typeof value === 'string' ) {
        if ( value.length === 0 ) { throw new Error(`[LocalizationService] localization code \`${ code }\` is empty in language \`${ language }\``); }
        target[ code ] = value;
        continue;
      }
      if ( ! this.isLocalizationTree(value) ) {
        throw new Error(`[LocalizationService] localization code \`${ code }\` must contain an object or string in language \`${ language }\``);
      }
      this.flattenLocalization(value, target, language, code);
    }
  }

  private isLocalizationTree(value:unknown):value is LocalizationTree {
    return typeof value === 'object' && value !== null && ! Array.isArray(value);
  }

}
