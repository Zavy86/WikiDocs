import { Component, input, InputSignal } from '@angular/core';
import { MetadataType } from 'src/app/types';
import { LocalizedPipe } from 'src/app/app.pipes';

@Component({
  standalone: true,
  selector: 'app-document-exists',
  templateUrl: './exists.component.html',
  imports: [ LocalizedPipe ],
})
export class DocumentExistsComponent {

  public readonly canWrite:InputSignal<boolean> = input<boolean>(false);
  public readonly hasChildren:InputSignal<boolean> = input<boolean>(false);
  public readonly metadata:InputSignal<MetadataType> = input.required<MetadataType>();

}
