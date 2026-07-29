import { AfterViewInit, Component, effect, ElementRef, input, OnDestroy, output, signal, viewChild, WritableSignal } from '@angular/core';
import type EasyMDEType from 'easymde';

export type EditorInsertRequest = {
  readonly id:number;
  readonly markdown:string;
};

@Component({
  standalone: true,
  selector: 'app-document-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class DocumentEditorComponent implements AfterViewInit, OnDestroy {
  public readonly raw = input.required<string>();
  public readonly insertRequest = input<EditorInsertRequest | null>(null);
  public readonly rawChanged = output<string>();
  public readonly insertRequestApplied = output<number>();
  private readonly editorTextarea = viewChild.required<ElementRef<HTMLTextAreaElement>>('editorTextarea');
  private editor:EasyMDEType | null = null;
  private editorInitializationToken = 0;
  private syncingFromInput = false;
  private readonly frontMatterLineIndexes = new Set<number>();
  private readonly isEditorReady:WritableSignal<boolean> = signal<boolean>(false);
  private lastAppliedInsertRequestId:number | null = null;

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

}
