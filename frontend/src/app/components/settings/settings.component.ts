import { finalize, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Component, computed, ElementRef, inject, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { HttpService } from 'src/app/services/http.service';
import { AlertService } from 'src/app/services/alert.service';
import { InformationService } from 'src/app/services/information.service';
import { ThemeService } from 'src/app/services/theme.service';
import { SettingsType } from 'src/app/types';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  imports: [ ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule ],
})
export class SettingsComponent {

  private initialSettings:SettingsType | null = null;

  private readonly alertService:AlertService = inject(AlertService);
  private readonly httpService:HttpService = inject(HttpService);
  private readonly informationService:InformationService = inject(InformationService);
  private readonly themeService:ThemeService = inject(ThemeService);
  private readonly breakpointObserver:BreakpointObserver = inject(BreakpointObserver);

  private readonly formBuilder:FormBuilder = inject(FormBuilder);

  protected readonly loading:WritableSignal<boolean> = signal(true);
  protected readonly saving:WritableSignal<boolean> = signal(false);
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
    this.loadSettings();
  }

  protected reset():void {
    if ( ! this.initialSettings ) { return; }
    this.patchForm(this.initialSettings);
  }

  protected save():void {
    if ( this.loading() || this.saving() ) { return; }
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
    this.httpService
      .PUT<void>('/settings', request)
      .pipe(finalize(():void => this.saving.set(false)))
      .subscribe({
        next: ():void => {
          this.initialSettings = request;
          this.patchForm(request);
          this.themeService.applyColor(request.color);
          this.alertService.success('Settings updated successfully.');
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(error.message || 'Unable to update settings.');
        }
      });
  }

  private loadSettings():void {
    this.loading.set(true);
    this.httpService
      .GET<SettingsType>('/settings')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (settings:SettingsType):void => {
          this.initialSettings = settings;
          this.patchForm(settings);
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(error.message || 'Unable to load settings.');
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
