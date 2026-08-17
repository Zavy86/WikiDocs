import { DOCUMENT } from '@angular/common';
import { Injectable, inject, Signal, signal, WritableSignal } from '@angular/core';
import { SettingsType } from 'src/app/types';

type CachedTheme = Pick<SettingsType, 'template' | 'color'>;

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private readonly cacheKey:string = 'THEME';
  private readonly document:Document = inject(DOCUMENT);
  private readonly activeTemplate:WritableSignal<SettingsType['template']> = signal<SettingsType['template']>('light');

  public readonly template:Signal<SettingsType['template']> = this.activeTemplate.asReadonly();

  public apply(template:SettingsType['template'], color:string):void {
    this.update(template, color);
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({ template, color } satisfies CachedTheme));
    } catch (error:unknown) {
      console.warn('[ThemeService] unable to store theme cache', error);
    }
  }

  public restore():void {
    let cachedValue:string | null;
    try {
      cachedValue = localStorage.getItem(this.cacheKey);
    } catch (error:unknown) {
      console.warn('[ThemeService] unable to read theme cache', error);
      return;
    }
    if ( cachedValue === null ) { return; }

    let cachedTheme:unknown;
    try {
      cachedTheme = JSON.parse(cachedValue);
    } catch (error:unknown) {
      console.warn('[ThemeService] invalid theme cache', error);
      this.clearCache();
      return;
    }
    if ( ! this.isCachedTheme(cachedTheme) ) {
      console.warn('[ThemeService] invalid theme cache');
      this.clearCache();
      return;
    }
    this.update(cachedTheme.template, cachedTheme.color);
  }

  private clearCache():void {
    try {
      localStorage.removeItem(this.cacheKey);
    } catch (error:unknown) {
      console.warn('[ThemeService] unable to clear theme cache', error);
    }
  }

  private isCachedTheme(value:unknown):value is CachedTheme {
    return typeof value === 'object'
      && value !== null
      && 'template' in value
      && ( value.template === 'light' || value.template === 'dark' )
      && 'color' in value
      && typeof value.color === 'string'
      && /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value.color);
  }

  private update(template:SettingsType['template'], color:string):void {
    const documentElement:HTMLElement = this.document.documentElement;
    documentElement.classList.toggle('app-theme-dark', template === 'dark');
    documentElement.style.setProperty('--theme-color', color);
    this.activeTemplate.set(template);
  }

}
