import { map, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { buildBackendUrl } from 'src/app/app.backend';
import { isImageAttachmentFileName } from 'src/app/app.utilities';
import { AlertService } from 'src/app/services/alert.service';
import { LocalizationService } from 'src/app/services/localization.service';
import { HttpService } from 'src/app/services/http.service';
import { ConfirmComponent, ConfirmData } from 'src/app/components/confirm/confirm.component';
import { LocalizedPipe } from 'src/app/app.pipes';
import { AttachmentType, DocumentType } from 'src/app/types';

export type AttachmentsDialogData = {
  readonly path:string;
  readonly attachments:ReadonlyArray<AttachmentType>;
};

export type AttachmentsDialogResult = {
  readonly markdown:string | null;
  readonly attachments:ReadonlyArray<AttachmentType>;
};

@Component({
  standalone: true,
  selector: 'app-attachments',
  templateUrl: './attachments.component.html',
  styleUrl: './attachments.component.scss',
  imports: [ MatDialogModule, MatButtonModule, MatIconModule, MatListModule, MatProgressBarModule, LocalizedPipe ],
})
export class AttachmentsComponent implements OnInit {

  private readonly alertService:AlertService = inject(AlertService);
  private readonly httpService:HttpService = inject(HttpService);
  private readonly dialog:MatDialog = inject(MatDialog);
  private readonly dialogRef:MatDialogRef<AttachmentsComponent, AttachmentsDialogResult> = inject(MatDialogRef<AttachmentsComponent, AttachmentsDialogResult>);
  private readonly localizationService:LocalizationService = inject(LocalizationService);

  protected readonly data:AttachmentsDialogData = inject<AttachmentsDialogData>(MAT_DIALOG_DATA);
  protected readonly attachments:WritableSignal<ReadonlyArray<AttachmentType>> = signal<ReadonlyArray<AttachmentType>>([ ...this.data.attachments ]);
  protected readonly selectedFileName:WritableSignal<string> = signal<string>('');
  protected readonly isUploading:WritableSignal<boolean> = signal<boolean>(false);
  protected readonly isRefreshing:WritableSignal<boolean> = signal<boolean>(false);
  protected readonly deletingAttachmentFile:WritableSignal<string | null> = signal<string | null>(null);

  private selectedFile:File | null = null;

  public ngOnInit():void {
    this.refreshAttachments();
  }

  protected close():void {
    this.dialogRef.close({
      markdown: null,
      attachments: [ ...this.attachments() ],
    });
  }

  protected onFileSelected(event:Event):void {
    const target:HTMLInputElement | null = ( event.target instanceof HTMLInputElement ? event.target : null );
    const [ file ] = ( target?.files ?? [] );
    this.selectedFile = ( file ?? null );
    this.selectedFileName.set(file?.name ?? '');
  }

  protected uploadSelectedFile():void {
    if ( this.isUploading() || this.isRefreshing() || ! this.selectedFile ) { return; }
    const fileName:string = this.selectedFile.name.trim();
    if ( fileName.length === 0 ) {
      this.alertService.error(this.localizationService.getText('attachments.messages.invalid-file-name'));
      return;
    }
    const hasConflictingName:boolean = this.attachments().some((attachment:AttachmentType):boolean => attachment.file.toLowerCase() === fileName.toLowerCase());
    if ( ! hasConflictingName ) {
      this.storeAttachment(this.selectedFile);
      return;
    }
    const data:ConfirmData = {
      title: this.localizationService.getText('attachments.dialogs.overwrite-title'),
      message: this.localizationService.getText('attachments.dialogs.overwrite-message', { file: fileName }),
      confirmLabel: this.localizationService.getText('common.actions.overwrite'),
      cancelLabel: this.localizationService.getText('common.actions.cancel'),
      confirmColor: 'warn',
    };
    this.openConfirmDialog(data).subscribe((confirmed:boolean):void => {
      if ( ! confirmed || ! this.selectedFile ) { return; }
      this.storeAttachment(this.selectedFile);
    });
  }

  protected insertAttachment(attachment:AttachmentType):void {
    this.dialogRef.close({
      markdown: this.buildMarkdown(attachment.file),
      attachments: [ ...this.attachments() ],
    });
  }

  protected requestDeleteAttachment(attachment:AttachmentType):void {
    if ( this.isUploading() || this.isRefreshing() || this.isDeletingAttachment(attachment.file) ) { return; }
    const data:ConfirmData = {
      title: this.localizationService.getText('attachments.dialogs.delete-title'),
      message: this.localizationService.getText('attachments.dialogs.delete-message', { file: attachment.file }),
      confirmLabel: this.localizationService.getText('common.actions.delete'),
      cancelLabel: this.localizationService.getText('common.actions.cancel'),
      confirmColor: 'warn',
    };
    this.openConfirmDialog(data).subscribe((confirmed:boolean):void => {
      if ( ! confirmed ) { return; }
      this.removeAttachment(attachment.file);
    });
  }

  protected isDeletingAttachment(fileName:string):boolean {
    return this.deletingAttachmentFile() === fileName;
  }

  protected isImageAttachment(fileName:string):boolean {
    return isImageAttachmentFileName(fileName);
  }

  protected getPreviewUrl(attachment:AttachmentType):string {
    const pathParam:string = encodeURIComponent(attachment.path);
    const fileParam:string = encodeURIComponent(attachment.file);
    const tokenParam:string = encodeURIComponent(attachment.token);
    return buildBackendUrl(`/attachment?path=${ pathParam }&file=${ fileParam }&token=${ tokenParam }`);
  }

  private openConfirmDialog(data:ConfirmData):Observable<boolean> {
    return this.dialog
      .open(ConfirmComponent, { width: '90vw', maxWidth: '520px', data })
      .afterClosed()
      .pipe(map((confirmed:boolean | undefined):boolean => confirmed === true));
  }

  private storeAttachment(file:File):void {
    const formData = new FormData();
    formData.set('file', file, file.name);
    const pathParam:string = encodeURIComponent(this.data.path);
    const fileParam:string = encodeURIComponent(file.name);
    const uri:string = `/attachment?path=${ pathParam }&file=${ fileParam }`;
    this.isUploading.set(true);
    this.httpService.UPLOAD<void>(uri, formData).subscribe({
      next: ():void => {
        this.selectedFile = null;
        this.selectedFileName.set('');
        this.alertService.success(this.localizationService.getText('attachments.messages.upload-success'));
        this.refreshAttachments();
      },
      error: (error:HttpErrorResponse):void => {
        this.isUploading.set(false);
        this.alertService.error(this.localizationService.getText('attachments.messages.upload-unavailable'));
      }
    });
  }

  private removeAttachment(fileName:string):void {
    if ( this.deletingAttachmentFile() ) { return; }
    this.deletingAttachmentFile.set(fileName);
    const pathParam:string = encodeURIComponent(this.data.path);
    const fileParam:string = encodeURIComponent(fileName);
    const uri:string = `/attachment?path=${ pathParam }&file=${ fileParam }`;
    this.httpService.DELETE<void>(uri).subscribe({
      next: ():void => {
        this.alertService.success(this.localizationService.getText('attachments.messages.delete-success', { file: fileName }));
        this.deletingAttachmentFile.set(null);
        this.refreshAttachments();
      },
      error: (error:HttpErrorResponse):void => {
        this.deletingAttachmentFile.set(null);
        this.alertService.error(this.localizationService.getText('attachments.messages.delete-unavailable', { file: fileName }));
      }
    });
  }

  private refreshAttachments():void {
    this.isRefreshing.set(true);
    this.httpService.GET<DocumentType>(`/document?path=${ encodeURIComponent(this.data.path) }`).subscribe({
      next: (document:DocumentType):void => {
        this.attachments.set([ ...document.attachments ]);
        this.isUploading.set(false);
        this.isRefreshing.set(false);
      },
      error: (error:HttpErrorResponse):void => {
        this.isUploading.set(false);
        this.isRefreshing.set(false);
        this.alertService.error(this.localizationService.getText('attachments.messages.refresh-unavailable'));
      }
    });
  }

  private buildMarkdown(fileName:string):string {
    const href:string = `./${ fileName }`;
    if ( this.isImageAttachment(fileName) ) { return `![${ fileName }](${ href })`; }
    return `[${ fileName }](${ href })`;
  }

}
