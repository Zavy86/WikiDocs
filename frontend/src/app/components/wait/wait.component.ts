import { Component, effect, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { SessionService } from 'src/app/services/session.service';

@Component({
  standalone: true,
  selector: 'app-wait',
  templateUrl: './wait.component.html',
  styleUrl: './wait.component.scss',
  imports: [ MatProgressSpinnerModule ],
})
export class WaitComponent {

  private readonly router:Router = inject(Router);
  private readonly sessionService:SessionService = inject(SessionService);

  private redirected:boolean = false;

  constructor() {
    effect(():void => {
      if ( this.redirected || ! this.sessionService.isReady() ) { return; }
      this.redirected = true;
      if ( this.sessionService.isValid() ) {
        let url:string = this.sessionService.takeUrlBeforeWait();
        if ( ! url ) { url = '/'; }
        void this.router.navigateByUrl(url);
        return;
      }
      void this.router.navigate([ '/authenticate' ]);
    });
  }
  
}
