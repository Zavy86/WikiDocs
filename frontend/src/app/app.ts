import { filter, map, Observable } from 'rxjs';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, computed, effect, inject, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SessionService } from 'src/app/services/session.service';
import { HttpService } from 'src/app/services/http.service';
import { InformationService } from 'src/app/services/information.service';
import { PrivacyService } from 'src/app/services/privacy.service';
import { AlertService } from 'src/app/services/alert.service';
import { AttachmentType, DocumentType, InformationType, MetadataType, PinnedType, SettingsType } from 'src/app/types';
import {
  ActionItem,
  AttachmentsComponent,
  AttachmentsDialogData,
  AttachmentsDialogResult,
  ConfirmComponent,
  ConfirmData,
  DividerComponent,
  DocumentMode,
  DocumentPageData,
  EditorInsertRequest,
  FooterComponent,
  HeaderComponent,
  InitializationComponent,
  PrivacyComponent,
  PromptComponent,
  PromptData,
  SidebarComponent,
  StartupComponent,
  TopComponent,
  TreeComponent,
  TreeData
} from 'src/app/components';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [ RouterOutlet, MatSidenavModule, SidebarComponent, HeaderComponent, DividerComponent, FooterComponent, PrivacyComponent, StartupComponent, InitializationComponent, TopComponent ]
})
export class App implements AfterViewInit {

  private readonly alertService:AlertService = inject(AlertService);
  private readonly httpService:HttpService = inject(HttpService);
  private readonly informationService:InformationService = inject(InformationService);
  private readonly dialog:MatDialog = inject(MatDialog);
  private readonly privacyService:PrivacyService = inject(PrivacyService);
  private readonly sessionService:SessionService = inject(SessionService);
  private readonly router:Router = inject(Router);

  private readonly breakpointObserver:BreakpointObserver = inject(BreakpointObserver);

  private readonly applicationPaths:Set<string> = new Set<string>([ '/wait', '/authenticate', '/profile', '/accounts', '/settings', '/search', '/trash' ]); // @todo proprio necessario?

  private readonly hasViewInitialized:WritableSignal<boolean> = signal(false);

  private readonly privacyComponent:Signal<PrivacyComponent> = viewChild.required(PrivacyComponent);

  private privacyModalPrompted:boolean = false;

  protected readonly startupError:Signal<string | null> = computed(():string | null => {
    return this.informationService.error() ?? this.sessionService.startupError();
  });

  protected readonly startupLoading:Signal<boolean> = computed(():boolean => this.informationService.loading());

  protected readonly showStartup:Signal<boolean> = computed(():boolean => this.startupLoading() || !! this.startupError());

  protected readonly showInitialization:Signal<boolean> = computed(():boolean => {
    const information:InformationType | null = this.informationService.retrieve();
    return ! this.showStartup() && !! information && ! information.initialized;
  });

  protected readonly settings:WritableSignal<SettingsType | null> = signal<SettingsType | null>(null);

  protected readonly search:WritableSignal<string> = signal('');

  protected readonly mode:WritableSignal<DocumentMode> = signal<DocumentMode>('view');

  protected readonly isAuthenticated:WritableSignal<boolean> = signal(false);

  protected readonly isGuestUser:WritableSignal<boolean> = signal(false);

  protected readonly isLocalUser:WritableSignal<boolean> = signal(false);

  protected readonly hasReadAuthorization:WritableSignal<boolean> = signal(false);

  protected readonly hasWriteAuthorization:WritableSignal<boolean> = signal(false);

  protected readonly hasManageAuthorization:WritableSignal<boolean> = signal(false);

  protected readonly hasDeleteAuthorization:WritableSignal<boolean> = signal(false);

  protected readonly currentDocument:WritableSignal<DocumentType | null> = signal<DocumentType | null>(null);

  protected readonly currentPath:WritableSignal<string> = signal<string>('/');

  protected readonly editorRaw:WritableSignal<string> = signal('');

  protected readonly editorInitialRaw:WritableSignal<string> = signal('');

  protected readonly pendingEditorInsertRequest:WritableSignal<EditorInsertRequest | null> = signal<EditorInsertRequest | null>(null);

  protected readonly isSavingDocument:WritableSignal<boolean> = signal(false);

  protected readonly isSidebarOpen:WritableSignal<boolean> = signal(false);

  protected readonly isMobile:Signal<boolean> = toSignal(this.breakpointObserver.observe('(max-width: 992px)').pipe(map((state:BreakpointState):boolean => state.matches)), { initialValue: false });

  protected readonly canEditDocument:Signal<boolean> = computed(():boolean => {
    return !! this.currentDocument() && this.hasWriteAuthorization();
  });

  protected readonly canAddPage:Signal<boolean> = computed(():boolean => {
    const document:DocumentType | null = this.currentDocument();
    return !! document && document.exists === true && this.hasWriteAuthorization();
  });

  protected readonly canDeleteDocument:Signal<boolean> = computed(():boolean => {
    return this.mode() === 'edit'
      && ! this.isSavingDocument()
      && this.hasDeleteAuthorization()
      && this.currentPath() !== '/'
      && ( this.currentDocument()?.exists ?? false );
  });

  protected readonly canMoveDocument:Signal<boolean> = computed(():boolean => {
    return this.mode() === 'edit'
      && ! this.isSavingDocument()
      && this.hasWriteAuthorization()
      && this.currentPath() !== '/'
      && ( this.currentDocument()?.exists ?? false );
  });

  protected readonly canOpenAttachments:Signal<boolean> = computed(():boolean => {
    return this.mode() === 'edit'
      && ! this.isSavingDocument()
      && this.hasWriteAuthorization()
      && ( this.currentDocument()?.exists ?? false );
  });

  protected readonly isEditorDirty:Signal<boolean> = computed(():boolean => this.editorRaw() !== this.editorInitialRaw());

  protected readonly canSaveDocument:Signal<boolean> = computed(():boolean => {
    return this.mode() === 'edit'
      && ! this.isSavingDocument()
      && this.isEditorDirty()
      && this.editorRaw().trim().length > 0;
  });

  protected readonly canOpenProfile:Signal<boolean> = computed(():boolean => this.isAuthenticated() && ! this.isGuestUser());

  protected readonly canOpenTrash:Signal<boolean> = computed(():boolean => this.isAuthenticated() && this.hasDeleteAuthorization());

  protected readonly canOpenSettings:Signal<boolean> = computed(():boolean => this.isAuthenticated() && this.hasManageAuthorization());

  protected readonly canOpenAccounts:Signal<boolean> = computed(():boolean => {
    const information:InformationType | null = this.informationService.retrieve();
    return this.isAuthenticated()
      && this.hasManageAuthorization()
      && information?.mode !== 'local';
  });

  protected readonly canSignOut:Signal<boolean> = computed(():boolean => {
    const information:InformationType | null = this.informationService.retrieve();
    return this.isAuthenticated() && ! this.isGuestUser() && ! this.isLocalUser();
  });

  protected readonly canPrintDocument:Signal<boolean> = computed(():boolean => ! this.applicationPaths.has(this.currentPath()));

  protected readonly canTogglePinnedDocument:Signal<boolean> = computed(():boolean => {
    const document:DocumentType | null = this.currentDocument();
    return this.mode() === 'view'
      && !! document
      && document.exists === true
      && ! this.applicationPaths.has(this.currentPath())
      && this.hasWriteAuthorization();
  });

  protected readonly showTop:Signal<boolean> = computed(():boolean => ! this.applicationPaths.has(this.currentPath()) && this.mode() === 'view');

  protected readonly genericActions:Signal<ReadonlyArray<ActionItem>> = computed<ReadonlyArray<ActionItem>>(():ActionItem[] => [
    ...( this.canOpenTrash() ? [ this.createAction('trash', 'delete_sweep', 'Trash') ] : [] ),
    ...( this.canOpenProfile() ? [ this.createAction('profile', 'person', 'Profile') ] : [] ),
    ...( this.canOpenAccounts() ? [ this.createAction('accounts', 'people', 'Accounts') ] : [] ),
    ...( this.canOpenSettings() ? [ this.createAction('settings', 'settings', 'Settings') ] : [] ),
    ...( this.canSignOut() ? [ this.createAction('logout', 'lock', 'Sign out') ] : [] ),
    ...( ! this.isAuthenticated() && ! this.isLocalUser() ? [ this.createAction('login', 'lock_open', 'Sign in') ] : [] ),
  ]);

  protected readonly viewActions:Signal<ReadonlyArray<ActionItem>> = computed<ReadonlyArray<ActionItem>>(():ActionItem[] => [
    ...( this.canPrintDocument() ? [ this.createAction('print', 'print', 'Print') ] : [] ),
    ...( this.canAddPage() ? [ this.createAction('new', 'add', 'New document') ] : [] ),
    ...( this.canEditDocument()
      ? [ this.createAction(
        'edit',
        this.currentDocument()?.exists === false ? 'add' : 'edit',
        this.currentDocument()?.exists === false ? 'Create document' : 'Edit document'
      ) ]
      : [] ),
    ...( this.canTogglePinnedDocument()
      ? [ this.createAction(
        'pin',
        this.isCurrentPathPinned() ? 'keep_off' : 'keep',
        this.isCurrentPathPinned() ? 'Unpin document' : 'Pin document'
      ) ]
      : [] )
  ]);

  protected readonly editActions:Signal<ReadonlyArray<ActionItem>> = computed<ReadonlyArray<ActionItem>>(():ActionItem[] => [
    this.createAction('cancel', 'cancel', 'Cancel editing', this.isSavingDocument(), 'grey'),
    ...( this.canMoveDocument()
      ? [ this.createAction('move', 'drive_file_move', 'Move document', false, 'blue') ]
      : [] ),
    ...( this.canOpenAttachments()
      ? [ this.createAction('attachments', 'attach_file', 'Attachments', false, 'purple') ]
      : [] ),
    ...( this.canDeleteDocument()
      ? [ this.createAction('delete', 'delete', 'Delete document', false, 'red') ]
      : [] ),
    this.createAction('save', 'save', 'Save', ! this.canSaveDocument()),
  ]);

  protected readonly pinnedDocuments:WritableSignal<ReadonlyArray<MetadataType>> = signal<ReadonlyArray<MetadataType>>([]);

  private readonly pendingEditPath:WritableSignal<string | null> = signal<string | null>(null);
  private editorInsertRequestSequence = 0;

  protected readonly documentPageData:Signal<DocumentPageData> = computed<DocumentPageData>(():DocumentPageData => ( {
    document: this.currentDocument(),
    mode: this.mode(),
    editorRaw: this.editorRaw(),
    editorInsertRequest: this.pendingEditorInsertRequest(),
    onEditorRawChange: (raw:string):void => this.onEditorRawChange(raw),
    onEditorInsertRequestApplied: (requestId:number):void => this.onEditorInsertRequestApplied(requestId),
  } ));

  constructor() {
    effect(():void => this.openPrivacyModalIfNeeded());
    this.loadInformationBoundState();
    this.loadDocumentForCurrentUrl();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(():void => {
      this.loadInformationBoundState();
      this.loadDocumentForCurrentUrl();
    });
    this.sessionService.authenticationChangedEvent.subscribe(():void => {
      if ( ! this.informationService.isInitialized() ) { return; }
      this.updateAuthenticationState();
      this.loadPinnedIfSessionReady();
    });
  }

  private openAttachmentsDialog():void {
    if ( ! this.canOpenAttachments() ) { return; }
    const document:DocumentType | null = this.currentDocument();
    if ( ! document ) { return; }
    const data:AttachmentsDialogData = {
      path: this.currentPath(),
      attachments: [ ...document.attachments ],
    };
    this.dialog
      .open(AttachmentsComponent, {
        width: '92vw',
        maxWidth: '900px',
        disableClose: true,
        data,
      })
      .afterClosed()
      .subscribe((result:AttachmentsDialogResult | undefined):void => {
        if ( ! result ) { return; }
        this.syncCurrentDocumentAttachments(result.attachments);
        if ( result.markdown ) { this.queueEditorInsertRequest(result.markdown); }
      });
  }

  ngAfterViewInit():void {
    this.hasViewInitialized.set(true);
  }

  private syncCurrentDocumentAttachments(attachments:ReadonlyArray<AttachmentType>):void {
    this.currentDocument.update((document:DocumentType | null):DocumentType | null => {
      if ( ! document ) { return null; }
      return { ...document, attachments: [ ...attachments ] };
    });
  }

  private queueEditorInsertRequest(markdown:string):void {
    this.editorInsertRequestSequence += 1;
    this.pendingEditorInsertRequest.set({
      id: this.editorInsertRequestSequence,
      markdown,
    });
  }

  private loadInformationBoundState():void {
    if ( ! this.informationService.isInitialized() ) {
      this.settings.set(null);
      this.pinnedDocuments.set([]);
      this.isAuthenticated.set(false);
      this.isGuestUser.set(false);
      this.isLocalUser.set(false);
      this.hasWriteAuthorization.set(false);
      this.hasDeleteAuthorization.set(false);
      this.hasManageAuthorization.set(false);
      return;
    }

    this.updateAuthenticationState();
    this.loadSettings();
    this.loadPinnedIfSessionReady();
  }

  private openPrivacyModalIfNeeded():void {
    if ( this.privacyModalPrompted ) { return; }
    if ( ! this.hasViewInitialized() ) { return; }
    if ( this.showStartup() ) { return; }
    if ( ! this.informationService.isInitialized() ) { return; }
    const settings:SettingsType | null = this.settings();
    // Wait for settings loading before deciding whether to prompt privacy consent.
    if ( settings === null ) { return; }
    if ( settings.privacy === null ) { return; }
    if ( this.privacyService.isAccepted() ) {
      this.privacyModalPrompted = true;
      return;
    }
    this.privacyModalPrompted = true;
    queueMicrotask(():void => this.privacyComponent().open());
  }

  private updateAuthenticationState():void {
    const isValid:boolean = this.sessionService.isValid();
    const isGuestUser:boolean = this.sessionService.isGuestUser();
    const isLocalUser:boolean = this.sessionService.isLocalUser();
    this.isGuestUser.set(isGuestUser);
    this.isLocalUser.set(isLocalUser);
    this.isAuthenticated.set(isValid && ! isGuestUser);
    this.hasReadAuthorization.set(isValid && this.sessionService.hasAuthorization('read'));
    this.hasWriteAuthorization.set(isValid && this.sessionService.hasAuthorization('write'));
    this.hasDeleteAuthorization.set(isValid && this.sessionService.hasAuthorization('delete'));
    this.hasManageAuthorization.set(isValid && this.sessionService.hasAuthorization('manage'));
  }

  private logout():void {
    this.sessionService.logout();
    this.updateAuthenticationState();
    this.redirect('/authenticate');
  }

  private redirect(path:string):void {
    void this.router.navigate([ path ]);
  }

  private startEditing():void {
    const document:DocumentType | null = this.currentDocument();
    if ( ! document || ! this.hasWriteAuthorization() ) { return; }
    const raw:string = ( document.content?.raw ?? '' );
    this.editorInitialRaw.set(raw);
    this.setEditorRaw(raw);
    this.mode.set('edit');
  }

  private cancelEditing():void {
    if ( ! this.isEditorDirty() ) {
      this.setEditorRaw(this.editorInitialRaw());
      this.mode.set('view');
      return;
    }
    this.openConfirmDialog({
      title: 'Discard changes',
      message: 'Are you sure you want to discard unsaved changes?',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      confirmColor: 'warn',
    }).subscribe((confirmed:boolean):void => {
      if ( ! confirmed ) { return; }
      this.setEditorRaw(this.editorInitialRaw());
      this.mode.set('view');
    });
  }

  private openMoveDialog():void {
    if ( ! this.canMoveDocument() ) { return; }
    if ( ! this.isEditorDirty() ) {
      this.openMoveSelectionDialog();
      return;
    }
    this.openConfirmDialog({
      title: 'Move document',
      message: 'You have unsaved changes. Are you sure you want to continue moving this document?',
      confirmLabel: 'Continue',
      cancelLabel: 'Cancel',
      confirmColor: 'primary',
    }).subscribe((confirmed:boolean):void => {
      if ( ! confirmed ) { return; }
      this.openMoveSelectionDialog();
    });
  }

  private openMoveSelectionDialog():void {
    this.dialog
      .open(TreeComponent, {
        width: '92vw',
        maxWidth: '860px',
        disableClose: true,
        data: {
          title: 'Move document',
          description: `Select the destination parent for ${ this.currentPath() }.`,
          submitLabel: 'Move',
          closeAriaLabel: 'Close move dialog',
          sourcePath: this.currentPath(),
        } satisfies TreeData,
      })
      .afterClosed()
      .subscribe((destination:string | null):void => {
        if ( ! destination ) { return; }
        this.moveDocument(destination);
      });
  }

  private saveDocument():void {
    if ( ! this.canSaveDocument() ) { return; }
    this.isSavingDocument.set(true);
    this.httpService.POST<void>(`/document?path=${ encodeURIComponent(this.currentPath()) }`, { raw: this.editorRaw() }).subscribe({
      next: ():void => {
        this.mode.set('view');
        this.isSavingDocument.set(false);
        this.editorInitialRaw.set(this.editorRaw());
        this.loadDocumentForCurrentUrl();
        this.alertService.success('Document saved successfully.');
      },
      error: (error:HttpErrorResponse) => {
        this.isSavingDocument.set(false);
        this.alertService.error(error.message || 'Unable to save document.');
      }
    });
  }

  private moveDocument(destination:string):void {
    if ( ! this.canMoveDocument() ) { return; }
    const sourcePath:string = this.currentPath();
    const sourceName:string | null = this.getLastPathSegment(sourcePath);
    if ( ! sourceName ) {
      this.alertService.error('Invalid source document path');
      return;
    }
    this.isSavingDocument.set(true);
    this.httpService.PATCH<void>(
      `/document?path=${ encodeURIComponent(sourcePath) }&destination=${ encodeURIComponent(destination) }`,
      null
    ).subscribe({
      next: ():void => {
        const destinationPrefix:string = ( destination === '/' ? '' : destination );
        const targetPath:string = `${ destinationPrefix }/${ sourceName }`;
        this.mode.set('view');
        this.isSavingDocument.set(false);
        void this.router.navigate([ targetPath ]).then(():void => this.loadDocumentForCurrentUrl());
        this.alertService.success('Document moved successfully.');
      },
      error: (error:HttpErrorResponse):void => {
        this.isSavingDocument.set(false);
        this.alertService.error(error.message || 'Unable to move document');
      }
    });
  }

  private deleteDocument():void {
    if ( ! this.canDeleteDocument() ) { return; }
    const path:string = this.currentPath();
    this.openConfirmDialog({
      title: 'Delete document',
      message: 'Are you sure you want to delete this document? Unsaved changes will be discarded and the document will be moved to trash',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmColor: 'warn',
    }).subscribe((confirmed:boolean):void => {
      if ( ! confirmed ) { return; }
      this.isSavingDocument.set(true);
      this.httpService.DELETE<void>(`/document?path=${ encodeURIComponent(path) }`).subscribe({
        next: ():void => {
          this.mode.set('view');
          this.setEditorRaw('');
          this.editorInitialRaw.set('');
          this.isSavingDocument.set(false);
          const parentPath:string = this.getParentPath(path);
          void this.router.navigate([ parentPath ]).then(():void => this.loadDocumentForCurrentUrl());
          this.alertService.warning('Document successfully deleted');
        },
        error: (error:HttpErrorResponse):void => {
          this.isSavingDocument.set(false);
          this.alertService.error(error.message || 'Unable to delete document');
        }
      });
    });
  }

  private getLastPathSegment(path:string):string | null {
    const segments:string[] = path.split('/').filter((segment:string):boolean => segment.length > 0);
    return segments.at(-1) ?? null;
  }

  private loadSettings():void {
    this.httpService.GET<SettingsType>('/settings').subscribe({
      next: (settings:SettingsType):void => {
        this.settings.set(settings);
      },
      error: (error:HttpErrorResponse):void => {
        console.error(error.message || 'Unable to load settings');
      }
    });
  }

  private loadDocumentForCurrentUrl():void {
    this.mode.set('view');
    this.pendingEditorInsertRequest.set(null);
    this.syncSearchQuery();
    const path:string = this.normalizePath(this.router.url);
    this.currentPath.set(path);
    if ( this.applicationPaths.has(path) ) {
      this.pendingEditPath.set(null);
      this.currentDocument.set(null);
      this.editorInitialRaw.set('');
      this.setEditorRaw('');
      return;
    }
    this.currentDocument.set(null);
    this.httpService.GET<DocumentType>(`/document?path=${ encodeURIComponent(path) }`).subscribe({
      next: (document:DocumentType):void => {
        this.currentDocument.set(document);
        const raw:string = ( document.content?.raw ?? '' );
        this.editorInitialRaw.set(raw);
        this.setEditorRaw(raw);
        if ( this.pendingEditPath() === path ) {
          this.pendingEditPath.set(null);
          this.startEditing();
        }
      },
      error: (error:HttpErrorResponse) => {
        if ( this.pendingEditPath() === path ) {
          this.pendingEditPath.set(null);
        }
        console.error(error.message || 'Unable to load document');
      }
    });
  }

  private syncSearchQuery():void {
    const rawQuery:unknown = this.router.parseUrl(this.router.url).queryParams[ 'q' ];
    this.search.set(typeof rawQuery === 'string' ? rawQuery.trim() : '');
  }

  private loadPinned():void {
    this.httpService.GET<PinnedType>('/pinned').subscribe({
      next: (pinned:PinnedType):void => {
        this.pinnedDocuments.set(pinned.documents);
      },
      error: (error:HttpErrorResponse):void => {
        this.pinnedDocuments.set([]);
        console.error(error.message || 'Unable to load pinned documents');
      }
    });
  }

  private loadPinnedIfSessionReady():void {
    if ( ! this.sessionService.isReady() || ! this.sessionService.isValid() ) {
      this.pinnedDocuments.set([]);
      return;
    }
    this.loadPinned();
  }

  private normalizePath(url:string):string {
    const [ pathWithoutQuery ] = url.split('?');
    if ( ! pathWithoutQuery || pathWithoutQuery === '/' ) { return '/'; }
    return ( pathWithoutQuery.startsWith('/') ? pathWithoutQuery : `/${ pathWithoutQuery }` );
  }

  private normalizeUserPath(rawPath:string):string | null {
    const normalized:string = rawPath
      .trim()
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/');
    if ( ! normalized ) { return null; }
    const withLeadingSlash:string = ( normalized.startsWith('/') ? normalized : `/${ normalized }` );
    const withoutTrailingSlash:string = withLeadingSlash.replace(/\/+$/g, '');
    return ( withoutTrailingSlash || '/' );
  }

  private getDefaultNewPath(path:string):string {
    const normalizedPath:string = this.normalizeUserPath(path) ?? '/';
    if ( normalizedPath === '/' ) { return '/new'; }
    return `${ normalizedPath }/new`;
  }

  private startAddingPage():void {
    const document:DocumentType | null = this.currentDocument();
    if ( ! document || document.exists !== true || ! this.hasWriteAuthorization() ) { return; }
    const defaultPath:string = this.getDefaultNewPath(this.currentPath());
    const data:PromptData = {
      title: 'New document',
      message: 'Enter the destination path for the new page:',
      label: 'Path',
      initialValue: defaultPath,
      confirmLabel: 'Create',
      cancelLabel: 'Cancel',
    };
    this.dialog.open(PromptComponent, { width: '90vw', maxWidth: '560px', data }).afterClosed().subscribe((rawInput:string | null):void => {
      if ( rawInput === null ) { return; }
      const targetPath:string | null = this.normalizeUserPath(rawInput);
      if ( ! targetPath ) {
        this.alertService.error('Invalid path');
        return;
      }
      if ( this.applicationPaths.has(targetPath) ) {
        this.alertService.error('This path is reserved by the application');
        return;
      }
      if ( targetPath === this.currentPath() ) {
        this.startEditing();
        return;
      }
      this.pendingEditPath.set(targetPath);
      void this.router.navigate([ targetPath ]).then((navigated:boolean) => {
        if ( navigated ) { return; }
        this.pendingEditPath.set(null);
        this.alertService.error('Unable to navigate to the selected path');
      });
    });
  }

  private openConfirmDialog(data:ConfirmData):Observable<boolean> {
    return this.dialog
      .open(ConfirmComponent, { width: '90vw', maxWidth: '520px', data })
      .afterClosed()
      .pipe(map((confirmed:boolean | undefined):boolean => confirmed === true));
  }

  private getParentPath(path:string):string {
    if ( ! path || path === '/' ) { return '/'; }
    const pathParts:string[] = path.split('/').filter((part) => part.length > 0);
    if ( pathParts.length <= 1 ) { return '/'; }
    return `/${ pathParts.slice(0, -1).join('/') }`;
  }

  private isCurrentPathPinned():boolean {
    return ( this.currentDocument()?.pinned === true );
  }

  private togglePinnedForCurrentPath():void {
    if ( ! this.canTogglePinnedDocument() ) { return; }
    const path:string = this.currentPath();
    const encodedPath:string = encodeURIComponent(path);
    const isPinned:boolean = this.isCurrentPathPinned();
    const request:Observable<void> = isPinned
      ? this.httpService.DELETE<void>(`/pinned?path=${ encodedPath }`)
      : this.httpService.POST<void>(`/pinned?path=${ encodedPath }`);
    request.subscribe({
      next: ():void => {
        this.currentDocument.update((document:DocumentType | null):DocumentType | null => {
          if ( ! document ) { return null; }
          return { ...document, pinned: ! isPinned };
        });
        this.loadPinnedIfSessionReady();
        this.alertService.success(isPinned ? 'Document unpinned successfully.' : 'Document pinned successfully.');
      },
      error: (error:HttpErrorResponse):void => {
        this.alertService.error(error.message || ( isPinned ? 'Unable to unpin document.' : 'Unable to pin document.' ));
      }
    });
  }

  private createAction(key:string, icon:string, tooltip:string, disabled?:boolean, variant?:ActionItem['variant']):ActionItem {
    return { key, icon, tooltip, disabled, variant };
  }

  private setEditorRaw(raw:string):void {
    this.editorRaw.set(raw);
  }

  protected onEditorRawChange(raw:string):void {
    this.setEditorRaw(raw);
  }

  protected onEditorInsertRequestApplied(requestId:number):void {
    if ( this.pendingEditorInsertRequest()?.id !== requestId ) { return; }
    this.pendingEditorInsertRequest.set(null);
  }

  protected onNavigationToggle():void {
    this.isSidebarOpen.update((isOpen:boolean):boolean => ( ! isOpen ));
  }

  protected retryStartupInformation():void {
    void this.informationService.load(true).then(():void => {
      this.sessionService.retryBootstrapSession();
      this.loadInformationBoundState();
    });
  }

  protected onHeaderActionClick(action:ActionItem):void {
    if ( action.key === 'new' ) { return this.startAddingPage(); }
    if ( action.key === 'edit' ) { return this.startEditing(); }
    if ( action.key === 'cancel' ) { return this.cancelEditing(); }
    if ( action.key === 'attachments' ) { return this.openAttachmentsDialog(); }
    if ( action.key === 'move' ) { return this.openMoveDialog(); }
    if ( action.key === 'delete' ) { return this.deleteDocument(); }
    if ( action.key === 'save' ) { return this.saveDocument(); }
    if ( action.key === 'pin' ) { return this.togglePinnedForCurrentPath(); }
    if ( action.key === 'print' ) { return window.print(); }
    if ( action.key === 'trash' ) { return this.redirect('/trash'); }
    if ( action.key === 'profile' ) { return this.redirect('/profile'); }
    if ( action.key === 'accounts' ) { return this.redirect(this.canOpenAccounts() ? '/accounts' : '/profile'); }
    if ( action.key === 'settings' ) { this.redirect('/settings'); }
    if ( action.key === 'login' ) { this.redirect('/authenticate'); }
    if ( action.key === 'logout' ) { this.logout(); }
  }

}
