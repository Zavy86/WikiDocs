import { DEBUG } from 'src/app/app.backend';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LogsService {

  private readonly debug:boolean = DEBUG;

  public log(...data:any[]):void {
    if ( this.debug ) { console.log(...data); }
  }

  public info(...data:any[]):void {
    if ( this.debug ) { console.info(...data); }
  }

  public warn(...data:any[]):void {
    if ( this.debug ) { console.warn(...data); }
  }

  public error(...data:any[]):void {
    if ( this.debug ) {console.error(...data); }
  }

}
