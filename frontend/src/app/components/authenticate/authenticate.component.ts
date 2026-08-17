import { finalize } from 'rxjs';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { LogsService } from 'src/app/services/logs.service';
import { LocalizationService } from 'src/app/services/localization.service';
import { SessionService } from 'src/app/services/session.service';
import { LocalizedPipe } from 'src/app/app.pipes';

@Component({
  standalone: true,
  selector: 'app-authenticate',
  templateUrl: './authenticate.component.html',
  styleUrl: './authenticate.component.scss',
  imports: [ ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, LocalizedPipe ],
})
export class AuthenticateComponent implements OnInit {
  private readonly router:Router = inject(Router);
  private readonly formBuilder:FormBuilder = inject(FormBuilder);
  private readonly sessionService:SessionService = inject(SessionService);
  private readonly logsService:LogsService = inject(LogsService);
  private readonly alertService:AlertService = inject(AlertService);
  private readonly localizationService:LocalizationService = inject(LocalizationService);

  protected readonly loading:WritableSignal<boolean> = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    account: [ '', [ Validators.required, Validators.email ] ],
    password: [ '', [ Validators.required ] ],
  });

  public ngOnInit():void {
    this.sessionService.logout();
  }

  protected authenticate():void {
    if ( this.loading() ) { return; }
    if ( this.form.invalid ) {
      this.form.markAllAsTouched();
      return;
    }
    const { account, password } = this.form.getRawValue();
    this.loading.set(true);
    this.sessionService
      .tryAuthenticate(account, password)
      .pipe(finalize(():void => this.loading.set(false)))
      .subscribe({
        next: (authenticated:boolean):void => {
          if ( ! authenticated ) {
            this.alertService.error(this.localizationService.getText('authentication.messages.failed'));
            return;
          }
          const nextUrl:string = this.sessionService.takeUrlBeforeWait();
          void this.router.navigateByUrl(nextUrl);
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(this.localizationService.getText('authentication.messages.failed'));
          this.logsService.error('[AuthenticateComponent] authentication request failed', {
            status: error.status,
            message: error.message,
            error: error.error,
          });
        },
      });
  }
}
