import { firstValueFrom } from 'rxjs';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { HttpService } from 'src/app/services/http.service';
import { LocalizationService } from 'src/app/services/localization.service';
import { InformationType } from 'src/app/types';

@Injectable({ providedIn: 'root' })
export class InformationService {

  private readonly loadingState:WritableSignal<boolean> = signal(false);
  private readonly errorState:WritableSignal<string | null> = signal<string | null>(null);
  private readonly informationState:WritableSignal<InformationType | null> = signal<InformationType | null>(null);

  private requestPromise:Promise<void> | null = null;

  constructor(
    private readonly httpService:HttpService,
    private readonly localizationService:LocalizationService,
  ) {}

  public loading():boolean {
    return this.loadingState();
  }

  public error():string | null {
    return this.errorState();
  }

  public retrieve():InformationType | null {
    return this.informationState();
  }

  public isInitialized():boolean {
    return this.informationState()?.initialized ?? false;
  }

  public async load(force:boolean = false):Promise<void> {
    if ( this.requestPromise ) { return this.requestPromise; }
    if ( ! force && this.informationState() ) { return; }
    this.loadingState.set(true);
    this.errorState.set(null);
    const request:Promise<void> = firstValueFrom(this.httpService.GET<InformationType>('/information'))
      .then((information:InformationType):void => {
        this.informationState.set(information);
      })
      .catch(():void => {
        this.informationState.set(null);
        this.errorState.set(this.localizationService.getText('startup.messages.information-unavailable'));
      })
      .finally(():void => {
        this.loadingState.set(false);
        this.requestPromise = null;
      });
    this.requestPromise = request;
    return request;
  }
  
}
