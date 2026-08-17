import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocalizationService } from 'src/app/services/localization.service';
import { LocalizedPipe, TimeZonePipe } from 'src/app/app.pipes';
import { DocumentType, SettingsType } from 'src/app/types';

@Component({
  standalone: true,
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  imports: [ RouterLink, TimeZonePipe, LocalizedPipe ],
})
export class FooterComponent {

  private readonly localizationService:LocalizationService = inject(LocalizationService);

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
    return ( notice.length > 0 ? notice : this.localizationService.getText('common.defaults.notice', { year: new Date().getFullYear() }) );
  });

  protected readonly author:Signal<string> = computed(():string => this.document()?.metadata?.author ?? '');

}
