import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { SettingsType } from 'src/app/types';

@Injectable({ providedIn: 'root' })
export class SettingsService {

  private readonly currentSettings:WritableSignal<SettingsType | null> = signal<SettingsType | null>(null);

  public readonly settings:Signal<SettingsType | null> = this.currentSettings.asReadonly();

  public load():Observable<SettingsType> {
    return this.httpService.GET<SettingsType>('/settings').pipe(tap((settings:SettingsType):void => this.currentSettings.set(settings)));
  }

  public clear():void {
    this.currentSettings.set(null);
  }

  public timezone():string {
    return this.settings()?.timezone ?? 'UTC';
  }

  constructor(private readonly httpService:HttpService) {}

}
