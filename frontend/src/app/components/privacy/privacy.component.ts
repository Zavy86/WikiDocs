import { Component, computed, inject, input, OnDestroy, Signal, TemplateRef, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PrivacyService } from 'src/app/services/privacy.service';
import { SettingsType } from 'src/app/types';

@Component({
  standalone: true,
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
  imports: [ MatDialogModule, MatButtonModule ],
})
export class PrivacyComponent implements OnDestroy {

  private readonly dialog:MatDialog = inject(MatDialog);
  private readonly privacyService:PrivacyService = inject(PrivacyService);

  private readonly modalTemplate:Signal<TemplateRef<unknown>> = viewChild.required<TemplateRef<unknown>>('modal');

  private modalRef:MatDialogRef<unknown> | null = null;

  protected readonly privacy:Signal<string> = computed(():string => this.settings()?.privacy ?? '');

  public readonly settings:Signal<SettingsType | null> = input<SettingsType | null>(null);

  ngOnDestroy():void {
    this.modalRef?.close();
    this.modalRef = null;
  }

  private close():void {
    this.modalRef?.close();
  }

  public open():void {
    if ( this.modalRef ) { return; }
    this.modalRef = this.dialog.open(this.modalTemplate(), { width: '90vw', maxWidth: '640px', disableClose: true });
    this.modalRef.afterClosed().subscribe(():null => this.modalRef = null);
  }

  public agree():void {
    this.privacyService.accept();
    this.close();
  }

  public disagree():void {
    window.location.assign('https://duckduckgo.com');
  }

}
