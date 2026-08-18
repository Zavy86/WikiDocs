import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LocalizedPipe } from 'src/app/app.pipes';

@Component({
  standalone: true,
  selector: 'app-back-to-top',
  templateUrl: './top.component.html',
  styleUrl: './top.component.scss',
  host: { '(window:scroll)': 'onWindowScroll()' },
  imports: [ MatButtonModule, MatIconModule, LocalizedPipe ]
})
export class TopComponent implements OnInit {

  protected readonly show:WritableSignal<boolean> = signal<boolean>(false);

  public ngOnInit():void {
    this.updateVisibility();
  }

  protected onWindowScroll():void {
    this.updateVisibility();
  }

  protected onClick():void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateVisibility():void {
    this.show.set(window.scrollY > 180);
  }

}
