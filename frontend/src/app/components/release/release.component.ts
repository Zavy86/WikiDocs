import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LocalizedPipe } from 'src/app/app.pipes';

export type ReleaseDialogData = {
  readonly latest:string;
};

@Component({
  standalone: true,
  selector: 'app-release',
  templateUrl: './release.component.html',
  imports: [ MatButtonModule, MatDialogModule, LocalizedPipe ],
})
export class ReleaseComponent {

  private readonly dialogRef:MatDialogRef<ReleaseComponent> = inject(MatDialogRef<ReleaseComponent>);

  protected readonly data:ReleaseDialogData = inject<ReleaseDialogData>(MAT_DIALOG_DATA);

  protected close():void {
    this.dialogRef.close();
  }

}
