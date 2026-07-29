import { finalize, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Component, inject, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/services/http.service';
import { SessionService } from 'src/app/services/session.service';
import { AlertService } from 'src/app/services/alert.service';
import { ProfileType } from 'src/app/types';

@Component({
  standalone: true,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  imports: [ ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule ],
})
export class ProfileComponent {

  private readonly alertService:AlertService = inject(AlertService);
  private readonly httpService:HttpService = inject(HttpService);
  private readonly sessionService:SessionService = inject(SessionService);
  private readonly formBuilder:FormBuilder = inject(FormBuilder);
  private readonly router:Router = inject(Router);
  private readonly breakpointObserver:BreakpointObserver = inject(BreakpointObserver);

  protected readonly saving:WritableSignal<boolean> = signal(false);
  protected readonly isMobile:Signal<boolean> = toSignal(this.breakpointObserver.observe('(max-width: 992px)').pipe(map((state:BreakpointState):boolean => state.matches)), { initialValue: false });
  protected readonly isLocalUser:Signal<boolean> = this.sessionService.isLocalUser;

  protected readonly form = this.formBuilder.nonNullable.group({
    account: [ this.sessionService.account() ?? '', [ Validators.required, Validators.email ] ],
    firstname: [ this.sessionService.firstname() ?? '', [ Validators.required, Validators.maxLength(32) ] ],
    lastname: [ this.sessionService.lastname() ?? '', [ Validators.required, Validators.maxLength(32) ] ],
    password: [ '', [ Validators.maxLength(256) ] ],
    confirm: [ '', [ Validators.maxLength(256) ] ],
  }); // @todo add password match validator

  constructor() {
    this.form.controls.account.disable({ emitEvent: false });
  }

  protected reset():void {
    this.form.reset({
      account: this.sessionService.account() ?? '',
      firstname: this.sessionService.firstname() ?? '',
      lastname: this.sessionService.lastname() ?? '',
      password: '',
      confirm: '',
    });
  }

  protected save():void {
    if ( this.saving() ) { return; }
    if ( this.form.controls.firstname.invalid || this.form.controls.lastname.invalid ) {
      this.form.controls.firstname.markAsTouched();
      this.form.controls.lastname.markAsTouched();
      return;
    }
    const { firstname, lastname, password, confirm } = this.form.getRawValue();
    const hasPasswordUpdate:boolean = ! this.isLocalUser() && [ password, confirm ].some((value):boolean => value.trim().length > 0);
    if ( hasPasswordUpdate ) {
      if ( ! password.trim() || ! confirm.trim() ) {
        this.alertService.error('To change your password, fill all password fields');
        return;
      }
      if ( password !== confirm ) {
        this.alertService.error('New password and check password must match');
        return;
      }
    }
    const request:ProfileType = { firstname: firstname.trim(), lastname: lastname.trim() };
    if ( hasPasswordUpdate ) { request.password = password; }
    this.saving.set(true);
    this.httpService
      .PATCH<void>('/profile', request)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: ():void => {
          this.alertService.success('Profile updated successfully');
          void this.router.navigateByUrl('/authenticate');
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(error.message || 'Unable to update profile');
        },
      });
  }
}
