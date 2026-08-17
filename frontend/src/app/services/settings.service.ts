import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { SettingsType } from 'src/app/types';

@Injectable({ providedIn: 'root' })
export class SettingsService {

  private readonly cacheKey:string = 'SETTINGS';
  private readonly currentSettings:WritableSignal<SettingsType | null> = signal<SettingsType | null>(null);

  public readonly settings:Signal<SettingsType | null> = this.currentSettings.asReadonly();

  constructor(private readonly httpService:HttpService) {}

  public load():Observable<SettingsType> {
    return this.httpService.GET<SettingsType>('/settings').pipe(tap((settings:SettingsType):void => this.set(settings)));
  }

  public update(settings:SettingsType):Observable<void> {
    return this.httpService.PUT<void>('/settings', settings).pipe(tap(():void => this.set(settings)));
  }

  public restore():void {
    let cachedValue:string | null;
    try {
      cachedValue = localStorage.getItem(this.cacheKey);
    } catch (error:unknown) {
      console.warn('[SettingsService] unable to read settings cache', error);
      return;
    }
    if ( cachedValue === null ) { return; }

    try {
      // The settings cache is intentionally trusted because the application writes the complete backend contract.
      this.currentSettings.set(JSON.parse(cachedValue) as SettingsType);
    } catch (error:unknown) {
      console.warn('[SettingsService] invalid settings cache', error);
      this.clear();
    }
  }

  public clear():void {
    this.currentSettings.set(null);
    try {
      localStorage.removeItem(this.cacheKey);
    } catch (error:unknown) {
      console.warn('[SettingsService] unable to clear settings cache', error);
    }
  }

  public timezone():string {
    return this.settings()?.timezone ?? 'UTC';
  }

  private set(settings:SettingsType):void {
    this.currentSettings.set(settings);
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(settings));
    } catch (error:unknown) {
      console.warn('[SettingsService] unable to store settings cache', error);
    }
  }

}
