import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export type ReleaseDialogData = {
  readonly latest:string;
};

@Component({
  standalone: true,
  selector: 'app-release',
  templateUrl: './release.component.html',
  imports: [ MatButtonModule, MatDialogModule ],
})
export class ReleaseComponent {

  private readonly dialogRef:MatDialogRef<ReleaseComponent> = inject(MatDialogRef<ReleaseComponent>);

  protected readonly data:ReleaseDialogData = inject<ReleaseDialogData>(MAT_DIALOG_DATA);

  protected close():void {
    this.dialogRef.close();
  }

}
