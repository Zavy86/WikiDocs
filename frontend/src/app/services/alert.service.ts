import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

@Injectable({ providedIn: 'root' })
export class AlertService {

  constructor(
    private snackBar:MatSnackBar,
  ) {}

  private alert(variant:AlertVariant, message:string):void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 9000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
      panelClass: [ `app-alert-${ variant }` ],
    });
  }

  public info(message:string):void {
    this.alert('info', message);
  }

  public success(message:string):void {
    this.alert('success', message);
  }

  public warning(message:string):void {
    this.alert('warning', message);
  }

  public error(message:string):void {
    this.alert('error', message);
  }

}
