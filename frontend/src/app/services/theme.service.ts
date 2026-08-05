import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private readonly document:Document = inject(DOCUMENT);

  public applyColor(color:string):void {
    this.document.documentElement.style.setProperty('--theme-color', color);
  }

}
