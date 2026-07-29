import { catchError, Observable, tap, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { buildBackendUrl } from 'src/app/app.backend';
import { LogsService } from 'src/app/services/logs.service';
import { SessionService } from 'src/app/services/session.service';

@Injectable({ providedIn: 'root' })
export class HttpService {

  constructor(
    private readonly httpClient:HttpClient,
    private readonly sessionService:SessionService,
    private readonly logsService:LogsService,
  ) {}

  private processError(error:unknown):Observable<never> {
    this.logsService.error('[HttpService] Error executing HTTP request', error);
    return throwError(() => error);
  }

  private getOptions():{ headers:HttpHeaders } {
    const token:string = this.sessionService.token();
    const headersConfig:Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if ( token ) { headersConfig[ 'Authorization' ] = `Bearer ${ token }`; }
    return { headers: new HttpHeaders(headersConfig) };
  }

  private getUploadOptions():{ headers:HttpHeaders } {
    const token:string = this.sessionService.token();
    const headersConfig:Record<string, string> = { Accept: 'application/json' };
    if ( token ) { headersConfig[ 'Authorization' ] = `Bearer ${ token }`; }
    return { headers: new HttpHeaders(headersConfig) };
  }

  public getToken():string {
    return this.sessionService.token();
  }

  public hasToken():boolean {
    return ( this.getToken() !== '' );
  }

  public HEAD<T>(uri:string):Observable<T> {
    const url:string = buildBackendUrl(uri);
    this.logsService.log('[HttpService] HEAD:', url);
    return this.httpClient.head<T>(url, this.getOptions()).pipe(
      catchError((error) => this.processError(error)),
      tap((response) => this.logsService.log('[HttpService] Response:', response))
    );
  }

  public GET<T>(uri:string):Observable<T> {
    const url:string = buildBackendUrl(uri);
    this.logsService.log('[HttpService] GET:', url);
    return this.httpClient.get<T>(url, this.getOptions()).pipe(
      catchError((error) => this.processError(error)),
      tap((response) => this.logsService.log('[HttpService] Response:', response))
    );
  }

  public POST<T>(uri:string, request:object | null = null):Observable<T> {
    const url:string = buildBackendUrl(uri);
    this.logsService.log('[HttpService] POST:', url);
    return this.httpClient.post<T>(url, request, this.getOptions()).pipe(
      catchError((error) => this.processError(error)),
      tap((response) => this.logsService.log('[HttpService] Response:', response))
    );
  }

  public PATCH<T>(uri:string, request:object | null = null):Observable<T> {
    const url:string = buildBackendUrl(uri);
    this.logsService.log('[HttpService] PATCH:', url);
    return this.httpClient.patch<T>(url, request, this.getOptions()).pipe(
      catchError((error) => this.processError(error)),
      tap((response) => this.logsService.log('[HttpService] Response:', response))
    );
  }

  public PUT<T>(uri:string, request:object | null = null):Observable<T> {
    const url:string = buildBackendUrl(uri);
    this.logsService.log('[HttpService] PUT:', url);
    return this.httpClient.put<T>(url, request, this.getOptions()).pipe(
      catchError((error) => this.processError(error)),
      tap((response) => this.logsService.log('[HttpService] Response:', response))
    );
  }

  public UPLOAD<T>(uri:string, request:FormData):Observable<T> {
    const url:string = buildBackendUrl(uri);
    this.logsService.log('[HttpService] UPLOAD:', url);
    return this.httpClient.post<T>(url, request, this.getUploadOptions()).pipe(
      catchError((error) => this.processError(error)),
      tap((response) => this.logsService.log('[HttpService] Response:', response))
    );
  }

  public DELETE<T>(uri:string):Observable<T> {
    const url:string = buildBackendUrl(uri);
    this.logsService.log('[HttpService] DELETE:', url);
    return this.httpClient.delete<T>(url, this.getOptions()).pipe(
      catchError((error) => this.processError(error)),
      tap((response) => this.logsService.log('[HttpService] Response:', response))
    );
  }

}
