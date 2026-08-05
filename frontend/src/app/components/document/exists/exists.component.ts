import { Component, input, InputSignal } from '@angular/core';
import { MetadataType } from 'src/app/types';

@Component({
  standalone: true,
  selector: 'app-document-exists',
  templateUrl: './exists.component.html',
})
export class DocumentExistsComponent {

  public readonly canWrite:InputSignal<boolean> = input<boolean>(false);
  public readonly hasChildren:InputSignal<boolean> = input<boolean>(false);
  public readonly metadata:InputSignal<MetadataType> = input.required<MetadataType>();

}
