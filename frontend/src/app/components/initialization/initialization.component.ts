import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { HttpService } from 'src/app/services/http.service';
import { InformationService } from 'src/app/services/information.service';
import { LocalizationService } from 'src/app/services/localization.service';
import { matchingFieldsErrorStateMatcher, matchingFieldsValidator } from 'src/app/app.validators';
import { LocalizedPipe } from 'src/app/app.pipes';
import { InitializationType } from 'src/app/types';

@Component({
  standalone: true,
  selector: 'app-initialization',
  templateUrl: './initialization.component.html',
  styleUrl: './initialization.component.scss',
  imports: [ ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, LocalizedPipe ],
})
export class InitializationComponent implements OnInit {
  private readonly alertService:AlertService = inject(AlertService);
  private readonly httpService:HttpService = inject(HttpService);
  private readonly informationService:InformationService = inject(InformationService);
  private readonly formBuilder:FormBuilder = inject(FormBuilder);
  private readonly router:Router = inject(Router);
  private readonly localizationService:LocalizationService = inject(LocalizationService);

  protected readonly loading:WritableSignal<boolean> = signal(false);
  protected readonly isLocalMode:WritableSignal<boolean> = signal(false);
  protected readonly passwordErrorStateMatcher = matchingFieldsErrorStateMatcher;

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      title: [ 'Wiki|Docs', [ Validators.required, Validators.maxLength(32) ] ],
      account: [ 'john.doe@wikidocs.app', [ Validators.required, Validators.email, Validators.maxLength(256) ] ],
      firstname: [ 'John', [ Validators.required, Validators.maxLength(32) ] ],
      lastname: [ 'Doe', [ Validators.required, Validators.maxLength(32) ] ],
      password: [ '', [ Validators.required, Validators.maxLength(256) ] ],
      confirm: [ '', [ Validators.required, Validators.maxLength(256) ] ],
    },
    { validators: [ matchingFieldsValidator('password', 'confirm') ] }
  );

  public ngOnInit():void {
    if ( this.informationService.isInitialized() ) {
      void this.router.navigate([ '/' ]);
      return;
    }
    this.isLocalMode.set(this.informationService.retrieve()?.mode === 'local');
    if ( this.isLocalMode() ) {
      this.form.clearValidators();
      this.form.controls.password.clearValidators();
      this.form.controls.password.updateValueAndValidity({ emitEvent: false });
      this.form.controls.confirm.clearValidators();
      this.form.controls.confirm.updateValueAndValidity({ emitEvent: false });
      this.form.updateValueAndValidity({ emitEvent: false });
    }
  }

  protected submitInitialization():void {
    if ( this.loading() ) { return; }
    if ( this.form.invalid ) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const formValues = this.form.getRawValue();
    const request:InitializationType = {
      title: formValues.title.trim(),
      account: formValues.account.trim(),
      firstname: formValues.firstname.trim(),
      lastname: formValues.lastname.trim(),
      password: this.isLocalMode() ? null : formValues.password,
    };
    this.httpService.POST<void>('/initialize', request)
      .pipe(finalize(():void => this.loading.set(false)))
      .subscribe({
        next: ():void => {
          void this.informationService.load(true).then(() => {
            void this.router.navigate([ '/' ]);
          });
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(this.localizationService.getText('initialization.messages.failed'));
        },
      });
  }

}
