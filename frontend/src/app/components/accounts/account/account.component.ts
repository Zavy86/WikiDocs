import { Component, computed, DestroyRef, inject, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { map, Observable } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';
import { AccountType } from 'src/app/types';
import { ConfirmComponent, ConfirmData } from 'src/app/components/confirm/confirm.component';
import { matchingFieldsErrorStateMatcher, matchingFieldsValidator } from 'src/app/app.validators';

export type AccountMode = 'create' | 'edit';

export type AccountData = {
  readonly mode:AccountMode;
  readonly account:AccountType | null;
  readonly selfAccount:string;
};

export type AccountResult = {
  readonly action:'save';
  readonly account:AccountType;
} | {
  readonly action:'delete';
  readonly account:string;
};

@Component({
  standalone: true,
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
  imports: [ ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule ],
})
export class AccountComponent {

  private readonly alertService:AlertService = inject(AlertService);
  private readonly formBuilder:FormBuilder = inject(FormBuilder);
  private readonly destroyRef:DestroyRef = inject(DestroyRef);
  private readonly dialog:MatDialog = inject(MatDialog);
  private readonly dialogRef:MatDialogRef<AccountComponent, AccountResult | null> = inject(MatDialogRef<AccountComponent, AccountResult | null>);

  protected readonly data:AccountData = inject<AccountData>(MAT_DIALOG_DATA);

  protected readonly title:Signal<string> = computed(():string => this.data.mode === 'create' ? 'Create account' : 'Edit account');
  protected readonly submitLabel:Signal<string> = computed(():string => this.data.mode === 'create' ? 'Create' : 'Save');
  protected readonly isEditMode:boolean = ( this.data.mode === 'edit' );
  protected readonly isSelfAccount:boolean = ( this.isEditMode && this.data.account?.account === this.data.selfAccount );
  protected readonly passwordErrorStateMatcher = matchingFieldsErrorStateMatcher;

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      account: [ this.data.account?.account ?? '', [ Validators.required, Validators.email, Validators.maxLength(256) ] ],
      firstname: [ this.data.account?.firstname ?? '', [ Validators.required, Validators.maxLength(32) ] ],
      lastname: [ this.data.account?.lastname ?? '', [ Validators.required, Validators.maxLength(32) ] ],
      role: [ ( this.data.account?.role ?? 'user' ) as AccountType['role'], [ Validators.required ] ],
      password: [ '', this.data.mode === 'create' ? [ Validators.required, Validators.maxLength(256) ] : [ Validators.maxLength(256) ] ],
      confirm: [ '', this.data.mode === 'create' ? [ Validators.required, Validators.maxLength(256) ] : [ Validators.maxLength(256) ] ]
    },
    { validators: [ matchingFieldsValidator('password', 'confirm') ] }
  );

  constructor() {
    if ( this.isEditMode ) { this.form.controls.account.disable({ emitEvent: false }); }
    this.dialogRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(():void => this.close());
    this.dialogRef
      .keydownEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event:KeyboardEvent):void => {
        if ( event.key !== 'Escape' ) { return; }
        event.preventDefault();
        this.close();
      });
  }

  protected close():void {
    if ( ! this.form.dirty ) {
      this.dialogRef.close(null);
      return;
    }
    this.openConfirmDialog({
      title: 'Discard changes',
      message: 'Are you sure you want to discard unsaved changes?',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      confirmColor: 'warn',
    }).subscribe((confirmed:boolean):void => {
      if ( ! confirmed ) { return; }
      this.dialogRef.close(null);
    });
  }

  protected reset():void {
    this.form.reset({
      account: this.data.account?.account ?? '',
      firstname: this.data.account?.firstname ?? '',
      lastname: this.data.account?.lastname ?? '',
      role: ( this.data.account?.role ?? 'user' ) as AccountType['role'],
      password: '',
      confirm: '',
    });
    if ( this.isEditMode ) { this.form.controls.account.disable({ emitEvent: false }); }
  }

  protected save():void {
    if ( this.form.invalid ) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const password:string = value.password;
    const passwordFilled:boolean = ( password.length > 0 );
    const account:AccountType = {
      account: value.account.trim(),
      firstname: value.firstname.trim(),
      lastname: value.lastname.trim(),
      role: value.role,
    };
    if ( passwordFilled ) { account.password = password; }
    this.dialogRef.close({ action: 'save', account });
  }

  protected remove():void {
    const account:string | undefined = this.data.account?.account;
    if ( ! this.isEditMode || ! account ) { return; }
    if ( this.isSelfAccount ) {
      this.alertService.error('You cannot delete your current account.');
      return;
    }
    this.openConfirmDialog({
      title: 'Delete account',
      message: `Are you sure you want to permanently delete the account "${ account }"?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmColor: 'warn',
    }).subscribe((confirmed:boolean):void => {
      if ( ! confirmed ) { return; }
      this.dialogRef.close({ action: 'delete', account });
    });
  }

  private openConfirmDialog(data:ConfirmData):Observable<boolean> {
    return this.dialog
      .open(ConfirmComponent, { width: '90vw', maxWidth: '520px', data })
      .afterClosed()
      .pipe(map((confirmed:boolean | undefined):boolean => confirmed === true));
  }

}
