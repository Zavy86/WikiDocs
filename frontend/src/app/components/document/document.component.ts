import { Component, computed, inject, Signal } from '@angular/core';
import { ROUTER_OUTLET_DATA } from '@angular/router';
import { SessionService } from 'src/app/services/session.service';
import { DocumentViewerComponent } from 'src/app/components/document/viewer/viewer.component';
import { DocumentExistsComponent } from 'src/app/components/document/exists/exists.component';
import { DocumentEditorComponent, EditorInsertRequest } from 'src/app/components/document/editor/editor.component';
import { AttachmentType, DocumentType } from 'src/app/types';

export type DocumentMode = 'view' | 'edit';

export type DocumentPageData = {
  readonly document:DocumentType | null;
  readonly mode:DocumentMode;
  readonly editorRaw:string;
  readonly editorInsertRequest:EditorInsertRequest | null;
  readonly onEditorRawChange:(raw:string) => void;
  readonly onEditorInsertRequestApplied:(requestId:number) => void;
  readonly onEditorAttachmentsChange:(attachments:ReadonlyArray<AttachmentType>) => void;
};

@Component({
  standalone: true,
  selector: 'app-document',
  templateUrl: './document.component.html',
  styleUrl: './document.component.scss',
  imports: [ DocumentViewerComponent, DocumentExistsComponent, DocumentEditorComponent ],
})
export class DocumentComponent {
  private readonly pageData:Signal<DocumentPageData> = inject<Signal<DocumentPageData>>(ROUTER_OUTLET_DATA);
  private readonly sessionService:SessionService = inject(SessionService);
  protected readonly document:Signal<DocumentType | null> = computed(():DocumentType | null => this.pageData().document);
  protected readonly mode:Signal<DocumentMode> = computed(():DocumentMode => this.pageData().mode);
  protected readonly editorRaw:Signal<string> = computed(():string => this.pageData().editorRaw);
  protected readonly editorInsertRequest:Signal<EditorInsertRequest | null> = computed(():EditorInsertRequest | null => this.pageData().editorInsertRequest);
  protected readonly canWrite:Signal<boolean> = computed(():boolean => this.sessionService.isValid() && this.sessionService.hasAuthorization('write'));

  protected onEditorRawChange(raw:string):void {
    this.pageData().onEditorRawChange(raw);
  }

  protected onEditorInsertRequestApplied(requestId:number):void {
    this.pageData().onEditorInsertRequestApplied(requestId);
  }

  protected onEditorAttachmentsChange(attachments:ReadonlyArray<AttachmentType>):void {
    this.pageData().onEditorAttachmentsChange(attachments);
  }

}
