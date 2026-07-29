import { format, isValid, parseISO } from 'date-fns';
import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocumentType, SettingsType } from 'src/app/types';

@Component({
  standalone: true,
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  imports: [ RouterLink ],
})
export class FooterComponent {

  public readonly settings:InputSignal<SettingsType | null> = input<SettingsType | null>(null);
  public readonly document:InputSignal<DocumentType | null> = input<DocumentType | null>(null);
  public readonly isAuthenticated:InputSignal<boolean> = input.required<boolean>();
  public readonly isMobile:InputSignal<boolean> = input<boolean>(false);

  protected readonly owner:Signal<string> = computed(():string => {
    const owner:string = ( this.settings()?.owner?.trim() ?? '' );
    return ( owner.length > 0 ? owner : 'Wiki|Docs' );
  });

  protected readonly notice:Signal<string> = computed(():string => {
    const notice:string = ( this.settings()?.notice?.trim() ?? '' );
    return ( notice.length > 0 ? notice : `Copyright ${ new Date().getFullYear() } All Rights Reserved` );
  });

  protected readonly author:Signal<string> = computed(():string => this.document()?.metadata?.author ?? '');

  protected readonly timestamp:Signal<string> = computed(():string => this.parseTimestamp() ?? '');

  private parseTimestamp():string | null {
    const timestamp:string | undefined = this.document()?.metadata?.timestamp;
    if ( ! timestamp ) { return null; }
    const date:Date = parseISO(timestamp);
    if ( ! isValid(date) ) { return null; }
    return format(date, 'yyyy-MM-dd HH:mm');
  }

}
