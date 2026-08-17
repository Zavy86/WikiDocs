import { DOCUMENT } from '@angular/common';
import { Injectable, inject, Signal, signal, WritableSignal } from '@angular/core';
import { SettingsType } from 'src/app/types';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private readonly document:Document = inject(DOCUMENT);
  private readonly activeTemplate:WritableSignal<SettingsType['template']> = signal<SettingsType['template']>('light');

  public readonly template:Signal<SettingsType['template']> = this.activeTemplate.asReadonly();

  public apply(template:SettingsType['template'], color:string):void {
    const documentElement:HTMLElement = this.document.documentElement;
    documentElement.classList.toggle('app-theme-dark', template === 'dark');
    documentElement.style.setProperty('--theme-color', color);
    this.activeTemplate.set(template);
  }

}
