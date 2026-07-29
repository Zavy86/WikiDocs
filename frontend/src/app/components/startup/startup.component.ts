import { Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  selector: 'app-startup',
  templateUrl: './startup.component.html',
  styleUrl: './startup.component.scss',
  imports: [ MatProgressSpinnerModule, MatButtonModule ],
})
export class StartupComponent {

  public readonly loading:InputSignal<boolean> = input<boolean>(false);
  public readonly error:InputSignal<string | null> = input<string | null>(null);

  public readonly retryRequested:OutputEmitterRef<void> = output<void>();

  protected retry():void {
    this.retryRequested.emit();
  }

}
