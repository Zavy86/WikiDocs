import { map } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { InformationService } from 'src/app/services/information.service';
import { SessionService } from 'src/app/services/session.service';

export type RouteAccessPolicy = 'public' | 'authenticated' | 'authorization';
export type RouteAuthorization = 'read' | 'write' | 'delete' | 'manage';

@Injectable({ providedIn: 'root' })
export class AppGuard implements CanActivate {

  private readonly router:Router = inject(Router);
  private readonly informationService:InformationService = inject(InformationService);
  private readonly sessionService:SessionService = inject(SessionService);

  canActivate(route:ActivatedRouteSnapshot, state:RouterStateSnapshot):MaybeAsync<GuardResult> {
    const accessPolicy = route.data?.[ 'policy' ] as RouteAccessPolicy | undefined;
    const authorization = route.data?.[ 'authorization' ] as RouteAuthorization | undefined;
    const information = this.informationService.retrieve();
    if ( ! this.informationService.loading() && ! this.informationService.error() && information && ! information.initialized ) { return true; }
    if ( route.routeConfig?.path === 'accounts' && information?.mode === 'local' ) {
      return this.router.createUrlTree([ '/profile' ]);
    }
    if ( accessPolicy === 'public' ) { return true; }
    if ( ! this.sessionService.isReady() ) {
      this.sessionService.setUrlBeforeWait(state.url);
      return this.router.createUrlTree([ '/wait' ]);
    }
    if ( this.sessionService.isValid() ) {
      return this.resolvePolicyAccess(state.url, accessPolicy, authorization);
    }
    return this.sessionService.ensureBootstrapSessionIfNeeded()
      .pipe(map(():boolean | UrlTree => this.resolvePolicyAccess(state.url, accessPolicy, authorization)));
  }

  private resolvePolicyAccess(currentUrl:string, accessPolicy:RouteAccessPolicy | undefined, authorization:RouteAuthorization | undefined):boolean | UrlTree {
    if ( ! this.sessionService.isValid() ) {
      return this.redirectToAuthenticate(currentUrl);
    }
    if ( accessPolicy === 'authenticated' && this.sessionService.isGuestUser() ) {
      return this.redirectToAuthenticate(currentUrl);
    }
    if ( accessPolicy === 'authorization' && authorization && ! this.sessionService.hasAuthorization(authorization) ) {
      return this.redirectToAuthenticate(currentUrl);
    }
    return true;
  }

  private redirectToAuthenticate(currentUrl:string):UrlTree {
    this.sessionService.setUrlBeforeWait(currentUrl);
    return this.router.createUrlTree([ '/authenticate' ]);
  }

}
