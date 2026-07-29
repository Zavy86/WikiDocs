import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, Injectable, Injector, signal, Signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, from, map, Observable, of, shareReplay, Subject, switchMap, tap } from 'rxjs';
import { buildBackendUrl } from 'src/app/app.backend';
import { InformationService } from 'src/app/services/information.service';
import { LogsService } from 'src/app/services/logs.service';
import { AuthenticateType, InformationType, JwtType, TokenType } from 'src/app/types';

@Injectable({ providedIn: 'root' })
export class SessionService {

  private expirationTimer:ReturnType<typeof setTimeout> | null = null;
  private bootstrapSessionRequest:Observable<boolean> | null = null;
  private informationService:InformationService | null = null;
  private readonly authenticationChangedSubject:Subject<void> = new Subject<void>();
  private readonly readyState:WritableSignal<boolean> = signal(false);
  private readonly validState:WritableSignal<boolean> = signal(false);
  private readonly tokenState:WritableSignal<string> = signal('');
  private readonly expirationState:WritableSignal<Date | null> = signal<Date | null>(null);
  private readonly accountState:WritableSignal<string | null> = signal<string | null>(null);
  private readonly firstnameState:WritableSignal<string | null> = signal<string | null>(null);
  private readonly lastnameState:WritableSignal<string | null> = signal<string | null>(null);
  private readonly roleState:WritableSignal<string | null> = signal(null);
  private readonly authorizationsState:WritableSignal<ReadonlyArray<string>> = signal<ReadonlyArray<string>>([]);
  private readonly startupErrorState:WritableSignal<string | null> = signal<string | null>(null);
  private readonly urlBeforeWaitState:WritableSignal<string> = signal('');

  public readonly authenticationChangedEvent:Observable<void> = this.authenticationChangedSubject.asObservable();
  public readonly isReady:Signal<boolean> = this.readyState.asReadonly();
  public readonly isValid:Signal<boolean> = this.validState.asReadonly();
  public readonly isGuestUser:Signal<boolean> = computed(():boolean => ( this.roleState() === 'guest' ));
  public readonly isLocalUser:Signal<boolean> = computed(():boolean => ( this.roleState() === 'local' ));
  public readonly token:Signal<string> = this.tokenState.asReadonly();
  public readonly expiration:Signal<Date | null> = this.expirationState.asReadonly();
  public readonly account:Signal<string | null> = this.accountState.asReadonly();
  public readonly firstname:Signal<string | null> = this.firstnameState.asReadonly();
  public readonly lastname:Signal<string | null> = this.lastnameState.asReadonly();
  public readonly role:Signal<string | null> = this.roleState.asReadonly();
  public readonly authorizations:Signal<ReadonlyArray<string>> = this.authorizationsState.asReadonly();
  public readonly startupError:Signal<string | null> = this.startupErrorState.asReadonly();

  constructor(
    private readonly router:Router,
    private readonly injector:Injector,
    private readonly httpClient:HttpClient,
    private readonly logsService:LogsService,
  ) {
    this.loadTokenFromLocalStorage();
    queueMicrotask(():void => this.checkIfTokenIsValid());
  }

  private getInformationService():InformationService {
    if ( this.informationService ) { return this.informationService; }
    this.informationService = this.injector.get(InformationService);
    return this.informationService;
  }

  private resolveBootstrapSessionEndpoint():Observable<'/local' | '/guest' | null> {
    const informationService:InformationService = this.getInformationService();
    return from(informationService.load()).pipe(
      map(():'/local' | '/guest' | null => {
        const information:InformationType | null = informationService.retrieve();
        if ( ! information ) {
          throw new Error(informationService.error() ?? 'Unable to resolve engine mode.');
        }
        if ( ! information.initialized ) {
          return null;
        }
        return information.mode === 'local' ? '/local' : '/guest';
      }),
    );
  }

  private setLocalStartupError(message:string, error:unknown):void {
    this.logsService.error(`[SessionService] ${ message }`, error);
    this.startupErrorState.set('Unable to initialize local administrator session.');
  }

  private clearStartupError():void {
    this.startupErrorState.set(null);
  }

  private decodeTokenPayload(encodedToken:string):TokenType {
    const payloadSegment:string = encodedToken.split('.')[ 1 ];
    if ( ! payloadSegment ) { throw new Error('Token payload is missing.'); }
    const base64:string = payloadSegment
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payloadSegment.length / 4) * 4, '=');
    const binaryPayload:string = window.atob(base64);
    const bytes:Uint8Array<ArrayBuffer> = Uint8Array.from(binaryPayload, (character:string):number => character.charCodeAt(0));
    const payload:string = new TextDecoder().decode(bytes);
    return JSON.parse(payload) as TokenType;
  }

  private applyTokenState(encodedToken:string):void {
    const payload:TokenType = this.decodeTokenPayload(encodedToken);
    const expiration = new Date(payload.expiration);
    if ( Number.isNaN(expiration.getTime()) ) { throw new Error('Token expiration is invalid.'); }
    if ( ! Array.isArray(payload.authorizations) ) { payload.authorizations = []; }
    this.tokenState.set(encodedToken);
    this.expirationState.set(expiration);
    this.accountState.set(payload.account);
    this.firstnameState.set(payload.firstname);
    this.lastnameState.set(payload.lastname);
    this.roleState.set(payload.role);
    this.authorizationsState.set([ ...payload.authorizations ]);
    this.logsService.log('[SessionService] token successfully loaded');
    this.scheduleExpirationCheck();
  }

  private scheduleExpirationCheck():void {
    if ( this.expirationTimer ) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
    const expiration:Date | null = this.expirationState();
    if ( ! expiration ) { return; }
    const timeout:number = expiration.getTime() - Date.now() + 10;
    if ( timeout <= 0 ) {
      this.checkIfTokenIsExpired();
      return;
    }
    this.expirationTimer = setTimeout(():void => this.checkIfTokenIsExpired(), timeout);
  }

  private loadTokenFromLocalStorage():void {
    const storedToken:string = localStorage.getItem('JWT') ?? '';
    if ( ! storedToken ) { return; }
    try {
      this.applyTokenState(storedToken);
    } catch ( error ) {
      this.logsService.error('[SessionService] invalid token in localStorage', error);
      this.destroySessionAndRemoveTokenFromLocalStorage();
    }
  }

  private checkIfTokenIsExpired():void {
    this.readyState.set(false);
    const expiration:Date | null = this.expirationState();
    if ( expiration && new Date() > expiration ) {
      this.logsService.warn('[SessionService] token expired, destroying session');
      this.destroySessionAndRemoveTokenFromLocalStorage();
      this.ensureBootstrapSessionIfNeeded().subscribe((authenticated:boolean):void => {
        if ( ! authenticated && ! this.startupErrorState() ) { void this.router.navigate([ '/authenticate' ]); }
      });
      return;
    }
    this.readyState.set(true);
  }

  private checkIfTokenIsValid():void {
    this.readyState.set(false);
    if ( ! this.hasToken() ) {
      this.ensureBootstrapSessionIfNeeded().subscribe();
      return;
    }
    this.verifyToken().subscribe({
      next: ():void => {
        this.validState.set(true);
        this.readyState.set(true);
        this.authenticationChangedSubject.next();
      },
      error: (error):void => {
        this.logsService.error('[SessionService] verifyToken failed', error);
        this.destroySessionAndRemoveTokenFromLocalStorage();
        this.ensureBootstrapSessionIfNeeded().subscribe();
      },
    });
  }

  private destroySessionAndRemoveTokenFromLocalStorage():void {
    if ( this.expirationTimer ) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
    this.readyState.set(true);
    this.validState.set(false);
    this.tokenState.set('');
    this.expirationState.set(null);
    this.accountState.set(null);
    this.firstnameState.set(null);
    this.lastnameState.set(null);
    this.roleState.set(null);
    this.authorizationsState.set([]);
    localStorage.removeItem('JWT');
  }

  private verifyToken():Observable<void> {
    return this.httpClient.head<void>(buildBackendUrl('/token'), { headers: this.getAuthorizationHeaders() });
  }

  public hasToken():boolean {
    return ( this.tokenState().length > 0 );
  }

  public hasAuthorization(authorization:string):boolean {
    return this.authorizationsState().includes(authorization);
  }

  public hasAtLeastOneAuthorization(authorizations:ReadonlyArray<string>):boolean {
    return authorizations.some((authorization:string):boolean => this.hasAuthorization(authorization));
  }

  public getAuthorizationHeaders():HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${ this.tokenState() }` });
  }

  public setNewTokenAndCheckIfIsValid(response:JwtType):void {
    this.applyTokenState(response.jwt);
    localStorage.setItem('JWT', response.jwt);
    this.checkIfTokenIsValid();
    this.authenticationChangedSubject.next();
  }

  public tryAuthenticate(account:string, password:string, duration:number = 86400):Observable<boolean> {
    this.destroySessionAndRemoveTokenFromLocalStorage();
    const request:AuthenticateType = { account, password, duration };
    return this.httpClient.post<JwtType>(buildBackendUrl('/authenticate'), request).pipe(
      map((authenticateResponse:JwtType):boolean => {
        if ( ! authenticateResponse.jwt ) { return false; }
        this.setNewTokenAndCheckIfIsValid(authenticateResponse);
        return true;
      }),
    );
  }

  public ensureBootstrapSessionIfNeeded():Observable<boolean> {
    if ( this.validState() ) { return of(true); }
    if ( this.bootstrapSessionRequest ) { return this.bootstrapSessionRequest; }
    this.readyState.set(false);
    this.validState.set(false);
    const request = this.resolveBootstrapSessionEndpoint().pipe(
      switchMap((endpoint:'/local' | '/guest' | null):Observable<boolean> => {
        if ( endpoint === null ) {
          this.clearStartupError();
          this.destroySessionAndRemoveTokenFromLocalStorage();
          this.readyState.set(true);
          return of(false);
        }
        const isLocalMode:boolean = endpoint === '/local';
        this.clearStartupError();
        return this.httpClient.get<JwtType>(buildBackendUrl(endpoint)).pipe(
          switchMap((response:JwtType):Observable<boolean> => {
            if ( ! response.jwt ) {
              if ( isLocalMode ) {
                this.setLocalStartupError('local authentication returned no jwt', response);
              } else {
                this.logsService.warn(`[SessionService] bootstrap session authentication returned no jwt (endpoint: ${ endpoint })`);
              }
              this.destroySessionAndRemoveTokenFromLocalStorage();
              this.readyState.set(true);
              return of(false);
            }
            try {
              this.applyTokenState(response.jwt);
              localStorage.setItem('JWT', response.jwt);
              console.log(response.jwt);
            } catch ( error ) {
              if ( isLocalMode ) {
                this.setLocalStartupError('invalid local jwt', error);
              } else {
                this.logsService.error(`[SessionService] invalid bootstrap session jwt (endpoint: ${ endpoint })`, error);
              }
              this.destroySessionAndRemoveTokenFromLocalStorage();
              this.readyState.set(true);
              return of(false);
            }
            return this.verifyToken().pipe(
              tap(():void => {
                this.validState.set(true);
                this.readyState.set(true);
                this.clearStartupError();
                this.authenticationChangedSubject.next();
              }),
              map(():boolean => true),
              catchError((error):Observable<boolean> => {
                if ( isLocalMode ) {
                  this.setLocalStartupError('local token verification failed', error);
                } else {
                  this.logsService.error(`[SessionService] bootstrap session token verification failed (endpoint: ${ endpoint })`, error);
                }
                this.destroySessionAndRemoveTokenFromLocalStorage();
                this.readyState.set(true);
                return of(false);
              }),
            );
          }),
          catchError((error):Observable<boolean> => {
            if ( isLocalMode ) {
              this.setLocalStartupError('local authentication failed', error);
            } else {
              this.logsService.warn(`[SessionService] bootstrap session authentication failed (endpoint: ${ endpoint })`, error);
            }
            this.destroySessionAndRemoveTokenFromLocalStorage();
            this.readyState.set(true);
            return of(false);
          }),
        );
      }),
      catchError((error:unknown):Observable<boolean> => {
        this.logsService.warn('[SessionService] unable to resolve bootstrap session endpoint', error);
        this.destroySessionAndRemoveTokenFromLocalStorage();
        this.readyState.set(true);
        return of(false);
      }),
      finalize(():void => {
        this.bootstrapSessionRequest = null;
      }),
      shareReplay(1),
    );
    this.bootstrapSessionRequest = request;
    return request;
  }

  public retryBootstrapSession():void {
    this.clearStartupError();
    this.ensureBootstrapSessionIfNeeded().subscribe();
  }

  public logout():void {
    const hadToken:boolean = this.hasToken();
    this.destroySessionAndRemoveTokenFromLocalStorage();
    if ( hadToken ) { this.authenticationChangedSubject.next(); }
  }

  public setUrlBeforeWait(url:string):void {
    if ( [ '/wait', '/authenticate' ].includes(url.toLowerCase()) ) {
      this.urlBeforeWaitState.set('');
      return;
    }
    this.urlBeforeWaitState.set(url);
  }

  public takeUrlBeforeWait():string {
    const url:string = this.urlBeforeWaitState();
    this.urlBeforeWaitState.set('');
    return url;
  }

}
