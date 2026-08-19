import { Subscription } from 'rxjs';
import { Component, computed, effect, inject, input, InputSignal, output, OutputEmitterRef, signal, Signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { HttpService } from 'src/app/services/http.service';
import { LocalizationService } from 'src/app/services/localization.service';
import { LocalizedPipe } from 'src/app/app.pipes';
import { DocumentType, MetadataType, SettingsType, TreeType } from 'src/app/types';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  imports: [ RouterLink, MatButtonModule, MatIconModule, LocalizedPipe ],
})
export class SidebarComponent {

  private readonly router:Router = inject(Router);
  private readonly httpService:HttpService = inject(HttpService);
  private readonly localizationService:LocalizationService = inject(LocalizationService);

  public readonly settings:InputSignal<SettingsType | null> = input<SettingsType | null>(null);
  public readonly search:InputSignal<string> = input<string>('');
  public readonly pinned:InputSignal<ReadonlyArray<MetadataType>> = input<ReadonlyArray<MetadataType>>([]);
  public readonly document:InputSignal<DocumentType | null> = input<DocumentType | null>(null);
  public readonly path:InputSignal<string> = input<string>('');
  public readonly opened:InputSignal<boolean> = input<boolean>(false);
  public readonly canClose:InputSignal<boolean> = input<boolean>(false);

  public readonly openedChange:OutputEmitterRef<boolean> = output<boolean>();

  protected readonly pinnedExpanded:WritableSignal<boolean> = signal(true);
  protected readonly sectionMetadata:WritableSignal<MetadataType | null> = signal<MetadataType | null>(null);
  protected readonly siblingEntries:WritableSignal<ReadonlyArray<MetadataType>> = signal<ReadonlyArray<MetadataType>>([]);
  protected readonly hasSiblingContext:WritableSignal<boolean> = signal(false);

  protected readonly owner:Signal<string> = computed(():string => {
    const owner:string = ( this.settings()?.owner?.trim() ?? '' );
    return ( owner.length > 0 ? owner : 'Wiki|Docs' );
  });

  protected readonly notice:Signal<string> = computed(():string => {
    const notice:string = ( this.settings()?.notice?.trim() ?? '' );
    return ( notice.length > 0 ? notice : this.localizationService.getText('common.defaults.notice', { year: new Date().getFullYear() }) );
  });

  protected readonly showDocument:Signal<boolean> = computed(():boolean => {
    const document:DocumentType | null = this.document();
    return !! document && ( document.exists === true || document.children.length > 0 );
  });

  constructor() {
    effect((onCleanup):void => {
      const document:DocumentType | null = this.document();
      if ( document === null ) { return; }
      const parentPath:string | null = this.getParentPath(document.metadata.path);
      if ( parentPath === null ) {
        this.sectionMetadata.set(null);
        this.siblingEntries.set([]);
        this.hasSiblingContext.set(false);
        return;
      }
      this.hasSiblingContext.set(true);
      const subscription:Subscription = this.httpService.GET<TreeType>(`/tree?path=${ encodeURIComponent(parentPath) }`).subscribe({
        next: (tree:TreeType):void => {
          this.sectionMetadata.set(tree.metadata);
          this.siblingEntries.set(tree.leaves);
        },
        error: ():void => {
          this.sectionMetadata.set(null);
          this.siblingEntries.set([]);
          this.hasSiblingContext.set(false);
        }
      });
      onCleanup(():void => subscription.unsubscribe());
    });
  }

  private normalizePath(url:string):string {
    const [ pathWithoutQuery ] = url.split('?');
    if ( ! pathWithoutQuery || pathWithoutQuery === '/' ) { return '/'; }
    return ( pathWithoutQuery.startsWith('/') ? pathWithoutQuery : `/${ pathWithoutQuery }` );
  }

  private getParentPath(path:string):string | null {
    const pathParts:string[] = path.split('/').filter((part:string):boolean => part.length > 0);
    if ( pathParts.length === 0 ) { return null; }
    if ( pathParts.length === 1 ) { return '/'; }
    return `/${ pathParts.slice(0, -1).join('/') }`;
  }

  isActive(entry:MetadataType):boolean {
    const current:string = this.normalizePath(this.path());
    return ( current === entry.path );
  }

  goToSearch(rawQuery:string):void {
    const query:string = rawQuery.trim();
    this.router.navigate([ '/search' ], { queryParams: query.length > 0 ? { q: query } : {} });
    this.closeSidenav();
  }

  togglePinned():void {
    this.pinnedExpanded.update((expanded:boolean):boolean => ! expanded);
  }

  onNavLinkClick():void {
    this.closeSidenav();
  }

  private closeSidenav():void {
    if ( ! this.canClose() || ! this.opened() ) { return; }
    this.openedChange.emit(false);
  }

}
