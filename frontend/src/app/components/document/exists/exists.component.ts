import { Component, input, InputSignal } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-document-exists',
  templateUrl: './exists.component.html',
})
export class DocumentExistsComponent {

  public readonly canWrite:InputSignal<boolean> = input<boolean>(false);
  
}
