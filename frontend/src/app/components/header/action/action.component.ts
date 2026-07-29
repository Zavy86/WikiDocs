import { Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export type ActionItem = {
  readonly key:string;
  readonly icon:string;
  readonly tooltip:string;
  readonly disabled?:boolean;
  readonly variant?:'default' | 'grey' | 'red' | 'yellow' | 'blue' | 'purple';
};

@Component({
  standalone: true,
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrl: './action.component.scss',
  imports: [ MatButtonModule, MatIconModule, MatTooltipModule ],
})
export class ActionComponent {

  public readonly action:InputSignal<ActionItem> = input.required<ActionItem>();
  public readonly clicked:OutputEmitterRef<ActionItem> = output<ActionItem>();

  protected onClick():void {
    this.clicked.emit(this.action());
  }

}
