import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AccountType } from 'src/app/types';
import { AccountsService } from 'src/app/services/accounts.service';
import { SessionService } from 'src/app/services/session.service';
import { AlertService } from 'src/app/services/alert.service';
import { AccountComponent, AccountData, AccountMode, AccountResult } from 'src/app/components/accounts/account/account.component';

@Component({
  standalone: true,
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
  imports: [ MatButtonModule, MatIconModule ],
})
export class AccountsComponent {
  private readonly accountsService:AccountsService = inject(AccountsService);
  private readonly alertService:AlertService = inject(AlertService);
  private readonly sessionService:SessionService = inject(SessionService);
  private readonly dialog:MatDialog = inject(MatDialog);

  protected readonly loading:WritableSignal<boolean> = signal(true);
  protected readonly processing:WritableSignal<boolean> = signal(false);
  protected readonly accounts:WritableSignal<ReadonlyArray<AccountType>> = signal<ReadonlyArray<AccountType>>([]);

  constructor() {
    this.loadAccounts();
  }

  protected openCreateDialog():void {
    this.openDialog('create', null);
  }

  protected openEditDialog(account:AccountType):void {
    this.openDialog('edit', account);
  }

  private openDialog(mode:AccountMode, account:AccountType | null):void {
    if ( this.processing() ) { return; }

    const data:AccountData = {
      mode,
      account,
      selfAccount: this.sessionService.account() ?? '',  // @todo migliorabile con boolean
    };
    this.dialog
      .open(AccountComponent, { width: '90vw', maxWidth: '720px', disableClose: true, data })
      .afterClosed()
      .subscribe((result:AccountResult | null):void => {
        if ( ! result ) { return; }
        if ( result.action === 'save' ) {
          this.saveAccount(result.account);
          return;
        }
        this.deleteAccount(result.account);
      });
  }

  private loadAccounts():void {
    this.loading.set(true);
    this.accountsService
      .retrieve()
      .pipe(finalize(():void => this.loading.set(false)))
      .subscribe({
        next: (accounts:ReadonlyArray<AccountType>):void => {
          this.accounts.set(this.sortAccounts(accounts));
        },
        error: (error:HttpErrorResponse):void => {
          this.accounts.set([]);
          this.alertService.error(error.message || 'Unable to load accounts.');
        }
      });
  }

  private saveAccount(account:AccountType):void {
    this.processing.set(true);
    this.accountsService
      .upsert(account)
      .pipe(finalize(():void => this.processing.set(false)))
      .subscribe({
        next: ():void => {
          this.alertService.success('Account saved successfully.');
          this.loadAccounts();
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(error.message || 'Unable to save account.');
        }
      });
  }

  private deleteAccount(account:string):void {
    if ( account === this.sessionService.account() ) {
      return this.alertService.error('You cannot delete your current account.');
    }
    this.processing.set(true);
    this.accountsService
      .remove(account)
      .pipe(finalize(():void => this.processing.set(false)))
      .subscribe({
        next: ():void => {
          this.alertService.warning('Account deleted successfully.');
          this.loadAccounts();
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(error.message || 'Unable to delete account.');
        }
      });
  }

  private sortAccounts(accounts:ReadonlyArray<AccountType>):ReadonlyArray<AccountType> {
    return [ ...accounts ].sort((left, right) => left.account.localeCompare(right.account));
  }

}
