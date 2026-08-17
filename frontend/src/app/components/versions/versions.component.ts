import { map, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertService } from 'src/app/services/alert.service';
import { HttpService } from 'src/app/services/http.service';
import { LocalizationService } from 'src/app/services/localization.service';
import { ConfirmComponent, ConfirmData } from 'src/app/components/confirm/confirm.component';
import { LocalizedPipe, TimeZonePipe } from 'src/app/app.pipes';
import { ContentType, DocumentType } from 'src/app/types';

export type VersionsDialogData = {
  readonly path:string;
  readonly versions:ReadonlyArray<string>;
  readonly canDelete:boolean;
};

export type VersionsDialogResult = {
  readonly raw:string | null;
  readonly versions:ReadonlyArray<string>;
};

@Component({
  standalone: true,
  selector: 'app-versions',
  templateUrl: './versions.component.html',
  styleUrl: './versions.component.scss',
  imports: [ MatDialogModule, MatButtonModule, MatIconModule, MatListModule, MatProgressBarModule, LocalizedPipe ],
  providers: [ TimeZonePipe ],
})
export class VersionsComponent {

  private readonly alertService:AlertService = inject(AlertService);
  private readonly httpService:HttpService = inject(HttpService);
  private readonly dialog:MatDialog = inject(MatDialog);
  private readonly dialogRef:MatDialogRef<VersionsComponent, VersionsDialogResult> = inject(MatDialogRef<VersionsComponent, VersionsDialogResult>);
  private readonly timeZonePipe:TimeZonePipe = inject(TimeZonePipe);
  private readonly localizationService:LocalizationService = inject(LocalizationService);

  protected readonly data:VersionsDialogData = inject<VersionsDialogData>(MAT_DIALOG_DATA);
  protected readonly versions:WritableSignal<ReadonlyArray<string>> = signal<ReadonlyArray<string>>([ ...this.data.versions ]);
  protected readonly isLoading:WritableSignal<boolean> = signal<boolean>(false);
  protected readonly deletingTimestamp:WritableSignal<string | null> = signal<string | null>(null);

  protected close():void {
    if ( this.isLoading() || this.deletingTimestamp() !== null ) { return; }
    this.dialogRef.close({ raw: null, versions: [ ...this.versions() ] });
  }

  protected formatTimestamp(timestamp:string):string {
    const date:Date = new Date(Number(timestamp));
    return this.timeZonePipe.transform(date, 'yyyy-MM-dd HH:mm:ss') ?? 'Unknown';
  }

  protected loadVersion(timestamp:string):void {
    if ( this.isLoading() || this.deletingTimestamp() !== null ) { return; }
    this.isLoading.set(true);
    const uri:string = `/version?path=${ encodeURIComponent(this.data.path) }&timestamp=${ encodeURIComponent(timestamp) }`;
    this.httpService.GET<ContentType>(uri).subscribe({
      next: (content:ContentType):void => {
        this.dialogRef.close({ raw: content.raw, versions: [ ...this.versions() ] });
      },
      error: (error:HttpErrorResponse):void => {
        this.isLoading.set(false);
        this.alertService.error(this.localizationService.getText('versions.messages.load-unavailable'));
        this.refreshVersions();
      }
    });
  }

  protected requestDeleteVersion(timestamp:string):void {
    if ( ! this.data.canDelete || this.isLoading() || this.deletingTimestamp() !== null ) { return; }
    const data:ConfirmData = {
      title: this.localizationService.getText('versions.delete-title'),
      message: this.localizationService.getText('versions.delete-message', { timestamp: this.formatTimestamp(timestamp) }),
      confirmLabel: this.localizationService.getText('common.actions.delete'),
      cancelLabel: this.localizationService.getText('common.actions.cancel'),
      confirmColor: 'warn',
    };
    this.openConfirmDialog(data).subscribe((confirmed:boolean):void => {
      if ( confirmed ) { this.deleteVersion(timestamp); }
    });
  }

  protected isDeleting(timestamp:string):boolean {
    return this.deletingTimestamp() === timestamp;
  }

  private deleteVersion(timestamp:string):void {
    this.deletingTimestamp.set(timestamp);
    const uri:string = `/version?path=${ encodeURIComponent(this.data.path) }&timestamp=${ encodeURIComponent(timestamp) }`;
    this.httpService.DELETE<void>(uri).subscribe({
      next: ():void => {
        this.deletingTimestamp.set(null);
        this.alertService.success(this.localizationService.getText('versions.messages.delete-success'));
        this.refreshVersions();
      },
      error: (error:HttpErrorResponse):void => {
        this.deletingTimestamp.set(null);
        this.alertService.error(this.localizationService.getText('versions.messages.delete-unavailable'));
        this.refreshVersions();
      }
    });
  }

  private refreshVersions():void {
    this.isLoading.set(true);
    this.httpService.GET<DocumentType>(`/document?path=${ encodeURIComponent(this.data.path) }`).subscribe({
      next: (document:DocumentType):void => {
        this.versions.set([ ...document.versions ]);
        this.isLoading.set(false);
      },
      error: (error:HttpErrorResponse):void => {
        this.isLoading.set(false);
        this.alertService.error(this.localizationService.getText('versions.messages.refresh-unavailable'));
      }
    });
  }

  private openConfirmDialog(data:ConfirmData):Observable<boolean> {
    return this.dialog
      .open(ConfirmComponent, { width: '90vw', maxWidth: '520px', data })
      .afterClosed()
      .pipe(map((confirmed:boolean | undefined):boolean => confirmed === true));
  }

}
