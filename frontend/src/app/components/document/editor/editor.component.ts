import { AfterViewInit, Component, DestroyRef, effect, ElementRef, inject, input, OnDestroy, output, signal, viewChild, WritableSignal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type EasyMDEType from 'easymde';
import { getImageAttachmentExtensionFromMimeType } from 'src/app/app.utilities';
import { AlertService } from 'src/app/services/alert.service';
import { HttpService } from 'src/app/services/http.service';

export type EditorInsertRequest = {
  readonly id:number;
  readonly markdown:string;
};

export type EditorPastedImageRequest = {
  readonly id:number;
  readonly image:File;
};

@Component({
  standalone: true,
  selector: 'app-document-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class DocumentEditorComponent implements AfterViewInit, OnDestroy {
  public readonly raw = input.required<string>();
  public readonly documentPath = input.required<string>();
  public readonly documentExists = input.required<boolean>();
  public readonly isSaving = input.required<boolean>();
  public readonly insertRequest = input<EditorInsertRequest | null>(null);
  public readonly pastedImageRequest = input<EditorPastedImageRequest | null>(null);
  public readonly rawChanged = output<string>();
  public readonly insertRequestApplied = output<number>();
  public readonly pastedImageRequestApplied = output<number>();
  public readonly initialDocumentSaveRequested = output<File>();
  private readonly alertService:AlertService = inject(AlertService);
  private readonly destroyRef:DestroyRef = inject(DestroyRef);
  private readonly httpService:HttpService = inject(HttpService);
  private readonly editorTextarea = viewChild.required<ElementRef<HTMLTextAreaElement>>('editorTextarea');
  private editor:EasyMDEType | null = null;
  private editorInitializationToken = 0;
  private syncingFromInput = false;
  private readonly frontMatterLineIndexes = new Set<number>();
  private readonly isEditorReady:WritableSignal<boolean> = signal<boolean>(false);
  private lastAppliedInsertRequestId:number | null = null;
  private lastAppliedPastedImageRequestId:number | null = null;

  public constructor() {
    effect(() => {
      const raw = this.raw();
      if ( ! this.editor || this.editor.value() === raw ) { return; }
      this.syncingFromInput = true;
      this.editor.value(raw);
      this.syncingFromInput = false;
    });
    effect(() => {
      const request:EditorInsertRequest | null = this.insertRequest();
      if ( ! this.isEditorReady() || ! request ) { return; }
      this.applyInsertRequest(request);
    });
    effect(() => {
      const request:EditorPastedImageRequest | null = this.pastedImageRequest();
      if ( ! this.isEditorReady() || ! request || this.lastAppliedPastedImageRequestId === request.id ) { return; }
      this.lastAppliedPastedImageRequestId = request.id;
      this.insertAndUploadImage(request.image);
      this.pastedImageRequestApplied.emit(request.id);
    });
  }

  public ngAfterViewInit():void {
    void this.initializeEditor();
  }

  public ngOnDestroy():void {
    this.editorInitializationToken += 1;
    this.isEditorReady.set(false);
    if ( ! this.editor ) { return; }
    this.clearFrontMatterLineClasses();
    this.editor.codemirror.off('change', this.onEditorContentChange);
    this.editor.codemirror.getWrapperElement().removeEventListener('paste', this.onEditorPaste);
    this.editor.toTextArea();
    this.editor.cleanup();
    this.editor = null;
  }

  private async initializeEditor():Promise<void> {
    const token = ++this.editorInitializationToken;
    const { default: EasyMDE } = await import('easymde');
    if ( token !== this.editorInitializationToken || this.editor ) { return; }
    this.editor = new EasyMDE({
      element: this.editorTextarea().nativeElement,
      hideIcons: [ 'preview', 'side-by-side', 'fullscreen' ],
      initialValue: this.raw(),
      autoDownloadFontAwesome: false,
      maxHeight: 'calc(100vh - 232px)',
      minHeight: 'calc(100vh - 232px)',
      spellChecker: false,
      shortcuts: {
        toggleFullScreen: null,
        togglePreview: null,
        toggleSideBySide: null,
      }
    });
    this.refreshFrontMatterLineClasses();
    this.editor.codemirror.on('change', this.onEditorContentChange);
    this.editor.codemirror.getWrapperElement().addEventListener('paste', this.onEditorPaste);
    this.isEditorReady.set(true);
  }

  private readonly onEditorContentChange = ():void => {
    if ( ! this.editor || this.syncingFromInput ) { return; }
    this.refreshFrontMatterLineClasses();
    this.rawChanged.emit(this.editor.value());
  }

  private clearFrontMatterLineClasses():void {
    if ( ! this.editor || this.frontMatterLineIndexes.size === 0 ) { return; }
    for ( const lineIndex of this.frontMatterLineIndexes ) {
      this.editor.codemirror.removeLineClass(lineIndex, 'wrap', 'cm-frontmatter-line');
    }
    this.frontMatterLineIndexes.clear();
  }

  private refreshFrontMatterLineClasses():void {
    if ( ! this.editor ) { return; }
    const document = this.editor.codemirror.getDoc();
    const lineCount:number = document.lineCount();
    this.clearFrontMatterLineClasses();
    if ( lineCount === 0 ) { return; }
    if ( document.getLine(0).trim() !== '---' ) { return; }

    let endFrontMatterLineIndex:number = lineCount - 1;
    for ( let index = 1; index < lineCount; index += 1 ) {
      if ( document.getLine(index).trim() === '---' ) {
        endFrontMatterLineIndex = index;
        break;
      }
    }

    for ( let index = 0; index <= endFrontMatterLineIndex; index += 1 ) {
      this.editor.codemirror.addLineClass(index, 'wrap', 'cm-frontmatter-line');
      this.frontMatterLineIndexes.add(index);
    }
  }

  private applyInsertRequest(request:EditorInsertRequest):void {
    if ( ! this.editor || this.lastAppliedInsertRequestId === request.id ) { return; }
    const document = this.editor.codemirror.getDoc();
    const cursor = document.getCursor('from');
    document.replaceRange(request.markdown, cursor, cursor);
    this.lastAppliedInsertRequestId = request.id;
    this.insertRequestApplied.emit(request.id);
    this.editor.codemirror.focus();
  }

  private readonly onEditorPaste = (event:ClipboardEvent):void => {
    const images:File[] = Array.from(event.clipboardData?.items ?? [])
      .filter((item:DataTransferItem):boolean => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item:DataTransferItem):File | null => item.getAsFile())
      .filter((file:File | null):file is File => file !== null);
    if ( images.length === 0 ) { return; }

    event.preventDefault();
    if ( images.length > 1 ) {
      this.alertService.error('Paste one image at a time.');
      return;
    }

    const image:File = images[0];
    const extension:string | null = getImageAttachmentExtensionFromMimeType(image.type);
    if ( ! extension ) {
      this.alertService.error(`Unsupported image type: ${ image.type || 'unknown' }.`);
      return;
    }

    if ( ! this.documentExists() ) {
      if ( this.isSaving() ) {
        this.alertService.warning('Wait for the document to be saved before pasting another image.');
        return;
      }
      this.initialDocumentSaveRequested.emit(image);
      return;
    }
    this.insertAndUploadImage(image);
  };

  private insertAndUploadImage(image:File):void {
    const extension:string | null = getImageAttachmentExtensionFromMimeType(image.type);
    if ( ! extension ) {
      this.alertService.error(`Unsupported image type: ${ image.type || 'unknown' }.`);
      return;
    }
    const fileName:string = `image_${ Date.now() }.${ extension }`;
    this.insertMarkdownAtCursor(`![${ fileName }](./${ fileName })`);
    this.uploadPastedImage(image, fileName);
  }

  private insertMarkdownAtCursor(markdown:string):void {
    if ( ! this.editor ) { return; }
    const document = this.editor.codemirror.getDoc();
    const cursor = document.getCursor('from');
    document.replaceRange(markdown, cursor, cursor);
  }

  private uploadPastedImage(image:File, fileName:string):void {
    const uploadedImage:File = new File([ image ], fileName, { type: image.type });
    const formData:FormData = new FormData();
    formData.set('file', uploadedImage, fileName);
    const uri:string = `/attachment?path=${ encodeURIComponent(this.documentPath()) }&file=${ encodeURIComponent(fileName) }`;
    this.httpService.UPLOAD<void>(uri, formData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ():void => {
        this.alertService.success('Image uploaded successfully.');
      },
      error: (error:HttpErrorResponse):void => {
        this.removeMarkdownForFailedUpload(fileName);
        this.alertService.error(error.message || 'Unable to upload image.');
      }
    });
  }

  private removeMarkdownForFailedUpload(fileName:string):void {
    if ( ! this.editor ) { return; }
    const escapedFileName:string = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern:RegExp = new RegExp(String.raw`!\[(?:\\.|[^\]\\])*\]\(\./${ escapedFileName }\)`);
    const currentRaw:string = this.editor.value();
    const rawWithoutFailedImage:string = currentRaw.replace(pattern, '');
    if ( rawWithoutFailedImage !== currentRaw ) { this.editor.value(rawWithoutFailedImage); }
  }

}
