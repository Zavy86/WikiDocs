import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type PromptData = {
  readonly title:string;
  readonly message:string;
  readonly label:string;
  readonly initialValue:string | null;
  readonly confirmLabel:string;
  readonly cancelLabel:string;
};

@Component({
  standalone: true,
  selector: 'app-prompt',
  templateUrl: './prompt.component.html',
  imports: [ ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule ],
})
export class PromptComponent {

  private readonly formBuilder:FormBuilder = inject(FormBuilder);
  private readonly dialogRef:MatDialogRef<PromptComponent, string | null> = inject(MatDialogRef<PromptComponent, string | null>);

  protected readonly data:PromptData = inject<PromptData>(MAT_DIALOG_DATA);
  protected readonly form = this.formBuilder.group({
    value: [ this.data.initialValue ],
  });

  protected cancel():void {
    this.dialogRef.close(null);
  }

  protected submit():void {
    this.dialogRef.close(this.form.controls.value.value);
  }

}
