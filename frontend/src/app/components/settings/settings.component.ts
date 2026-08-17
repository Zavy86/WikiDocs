import { finalize, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Component, computed, ElementRef, inject, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AlertService } from 'src/app/services/alert.service';
import { InformationService } from 'src/app/services/information.service';
import { LocalizationService } from 'src/app/services/localization.service';
import { ReleaseService } from 'src/app/services/release.service';
import { SettingsService } from 'src/app/services/settings.service';
import { LocalizedPipe } from 'src/app/app.pipes';
import { SettingsType } from 'src/app/types';

type LocalizationOption = {
  readonly code:SettingsType['localization'];
  readonly label:string;
};

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  imports: [ ReactiveFormsModule, MatAutocompleteModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, LocalizedPipe ],
})
export class SettingsComponent {

  private initialSettings:SettingsType | null = null;

  private readonly alertService:AlertService = inject(AlertService);
  private readonly informationService:InformationService = inject(InformationService);
  private readonly releaseService:ReleaseService = inject(ReleaseService);
  private readonly settingsService:SettingsService = inject(SettingsService);
  private readonly breakpointObserver:BreakpointObserver = inject(BreakpointObserver);
  private readonly localizationService:LocalizationService = inject(LocalizationService);

  private readonly formBuilder:FormBuilder = inject(FormBuilder);

  protected readonly loading:WritableSignal<boolean> = signal(true);
  protected readonly saving:WritableSignal<boolean> = signal(false);
  protected readonly checkingRelease:WritableSignal<boolean> = signal(false);
  protected readonly timezoneLoadError:WritableSignal<string | null> = signal<string | null>(null);
  protected readonly timezoneOptions:WritableSignal<ReadonlyArray<string>> = signal<ReadonlyArray<string>>([]);
  protected readonly timezoneSearch:WritableSignal<string> = signal<string>('');
  protected readonly filteredTimezones:Signal<ReadonlyArray<string>> = computed(():ReadonlyArray<string> => {
    const query:string = this.timezoneSearch().trim().toLocaleLowerCase();
    return query.length === 0
      ? this.timezoneOptions()
      : this.timezoneOptions().filter((timezone:string):boolean => timezone.toLocaleLowerCase().includes(query));
  });
  protected readonly localizationOptions:Signal<ReadonlyArray<LocalizationOption>> = computed(():ReadonlyArray<LocalizationOption> => {
    const language:SettingsType['localization'] = this.localizationService.language();
    return ([ 'cs', 'de', 'en', 'es', 'fa', 'fr', 'it', 'ja', 'nl', 'pl', 'pt', 'ru', 'zh' ] as const)
      .map((code):LocalizationOption => ({ code, label: this.localizationService.getText(`settings.languages.${ code }`) }))
      .sort((first:LocalizationOption, second:LocalizationOption):number => first.label.localeCompare(second.label, language));
  });
  protected readonly isMobile:Signal<boolean> = toSignal(this.breakpointObserver.observe('(max-width: 992px)').pipe(map((state:BreakpointState):boolean => state.matches)), { initialValue: false });
  protected readonly isLocalMode:Signal<boolean> = computed(():boolean => this.informationService.retrieve()?.mode === 'local');
  protected readonly colorPicker:Signal<ElementRef<HTMLInputElement>> = viewChild.required<ElementRef<HTMLInputElement>>('colorPicker');

  protected readonly form = this.formBuilder.nonNullable.group({
    title: [ '', [ Validators.required, Validators.maxLength(32) ] ],
    subtitle: [ '', [ Validators.required, Validators.maxLength(64) ] ],
    owner: [ '', [ Validators.required, Validators.maxLength(64) ] ],
    notice: [ '', [ Validators.required, Validators.maxLength(128) ] ],
    privacy: [ '' as string | null, [ Validators.maxLength(1024) ] ],
    localization: [ 'en' as SettingsType['localization'], [ Validators.required ] ],
    timezone: [ '', [ Validators.required, Validators.maxLength(32) ] ],
    template: [ 'light' as SettingsType['template'], [ Validators.required ] ],
    color: [ '#4caf50', [ Validators.required, Validators.pattern(/^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/) ] ],
  });

  constructor() {
    this.loadTimezones();
    this.loadSettings();
  }

  protected reset():void {
    if ( ! this.initialSettings ) { return; }
    this.patchForm(this.initialSettings);
  }

  protected save():void {
    if ( this.loading() || this.saving() || this.timezoneLoadError() !== null ) { return; }
    if ( this.form.invalid ) {
      this.form.markAllAsTouched();
      return;
    }
    const formValues = this.form.getRawValue();
    const privacy:string | null = formValues.privacy === null || formValues.privacy.trim() === '' ? null : formValues.privacy.trim();
    const request:SettingsType = {
      title: formValues.title.trim(),
      subtitle: formValues.subtitle.trim(),
      owner: formValues.owner.trim(),
      notice: formValues.notice.trim(),
      privacy,
      localization: formValues.localization,
      timezone: formValues.timezone.trim(),
      template: formValues.template,
      color: formValues.color,
    };

    this.saving.set(true);
    this.settingsService
      .update(request)
      .pipe(finalize(():void => this.saving.set(false)))
      .subscribe({
        next: ():void => {
          this.initialSettings = request;
          this.patchForm(request);
          this.alertService.success(this.localizationService.getText('settings.messages.update-success'));
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(this.localizationService.getText('settings.messages.update-unavailable'));
        }
      });
  }

  private loadSettings():void {
    this.loading.set(true);
    this.settingsService
      .load()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (settings:SettingsType):void => {
          this.initialSettings = settings;
          this.patchForm(settings);
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(this.localizationService.getText('settings.messages.load-unavailable'));
        }
      });
  }

  private patchForm(settings:SettingsType):void {
    this.form.reset({
      title: settings.title,
      subtitle: settings.subtitle,
      owner: settings.owner,
      notice: settings.notice,
      privacy: settings.privacy ?? '',
      localization: settings.localization,
      timezone: settings.timezone,
      template: settings.template,
      color: settings.color,
    });
  }

  protected checkForNewVersions():void {
    if ( this.checkingRelease() ) { return; }
    this.checkingRelease.set(true);
    this.releaseService
      .refresh(true)
      .pipe(finalize(():void => this.checkingRelease.set(false)))
      .subscribe({
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(this.localizationService.getText('release.messages.check-unavailable'));
        }
      });
  }

  private loadTimezones():void {
    if ( typeof Intl.supportedValuesOf !== 'function' ) {
      this.timezoneLoadError.set(this.localizationService.getText('settings.messages.timezone-unsupported'));
      return;
    }
    this.timezoneOptions.set([ 'UTC', ...Intl.supportedValuesOf('timeZone') ].sort((first:string, second:string):number => first.localeCompare(second)));
  }

  protected colorPickerValue():string {
    const color:string = this.form.controls.color.value;
    if ( /^#[0-9A-Fa-f]{3}$/.test(color) ) {
      return `#${ color[1] }${ color[1] }${ color[2] }${ color[2] }${ color[3] }${ color[3] }`;
    }
    return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#000000';
  }

  protected openColorPicker():void {
    this.colorPicker().nativeElement.click();
  }

  protected onColorPickerChange(event:Event):void {
    const target:EventTarget | null = event.target;
    if ( ! ( target instanceof HTMLInputElement ) ) { return; }
    this.form.controls.color.setValue(target.value);
  }

}
