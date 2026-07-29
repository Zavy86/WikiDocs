import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export type ConfirmData = {
  readonly title:string;
  readonly message:string;
  readonly confirmLabel:string;
  readonly cancelLabel:string;
  readonly confirmColor:'primary' | 'accent' | 'warn';
};

@Component({
  standalone: true,
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrl: './confirm.component.scss',
  imports: [ MatDialogModule, MatButtonModule ],
})
export class ConfirmComponent {

  private readonly dialogRef:MatDialogRef<ConfirmComponent, boolean> = inject(MatDialogRef<ConfirmComponent, boolean>);

  protected readonly data:ConfirmData = inject<ConfirmData>(MAT_DIALOG_DATA);

  protected cancel():void {
    this.dialogRef.close(false);
  }

  protected confirm():void {
    this.dialogRef.close(true);
  }

}
