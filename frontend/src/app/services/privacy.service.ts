import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PrivacyService {

  public isAccepted():boolean {
    const cookies:string[] = document.cookie.split(';');
    for ( const entry of cookies ) { if ( entry.trim() === 'privacy=accepted' ) { return true; } }
    return false;
  }

  public accept():void {
    const expiresAt = new Date(Date.now() + ( 7 * 24 * 60 * 60 * 1000 ));
    document.cookie = `privacy=accepted; expires=${ expiresAt.toUTCString() }; path=/; SameSite=Lax`;
  }

}
