import { Component, computed, input, InputSignal, output, OutputEmitterRef, Signal, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ActionComponent, ActionItem } from 'src/app/components/header/action/action.component';
import { DocumentType, SettingsType } from 'src/app/types';
import { DocumentMode } from "src/app/components";

export type BreadcrumbEntry = {
  readonly path:string;
  readonly label:string;
  readonly isCurrent:boolean;
};

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [ RouterLink, MatButtonModule, MatIconModule, ActionComponent ]
})
export class HeaderComponent {

  public readonly isMobile:InputSignal<boolean> = input<boolean>(false);
  public readonly mode:InputSignal<DocumentMode> = input.required<DocumentMode>();
  public readonly settings:InputSignal<SettingsType | null> = input<SettingsType | null>(null);
  public readonly document:InputSignal<DocumentType | null> = input<DocumentType | null>(null);

  public readonly genericActions:InputSignal<ReadonlyArray<ActionItem>> = input<ReadonlyArray<ActionItem>>([]);
  public readonly viewActions:InputSignal<ReadonlyArray<ActionItem>> = input<ReadonlyArray<ActionItem>>([]);
  public readonly editActions:InputSignal<ReadonlyArray<ActionItem>> = input<ReadonlyArray<ActionItem>>([]);

  public readonly navigationToggled:OutputEmitterRef<void> = output<void>();
  public readonly actionClicked:OutputEmitterRef<ActionItem> = output<ActionItem>();

  protected readonly showMobileActions:WritableSignal<boolean> = signal<boolean>(false);

  protected readonly showSidebarToggle:Signal<boolean> = computed(():boolean => this.isMobile());

  protected readonly hasActiveActions:Signal<boolean> = computed(():boolean => this.activeActions().length > 0);

  protected readonly activeActions:Signal<ReadonlyArray<ActionItem>> = computed(():ReadonlyArray<ActionItem> => {
    const mode:DocumentMode = this.mode();
    if ( mode === 'view' ) { return [ ...this.viewActions(), ...this.genericActions() ]; }
    if ( mode === 'edit' ) { return [ ...this.editActions() ]; }
    return [];
  });

  protected readonly isRoot:Signal<boolean> = computed(():boolean => {
    return ( ( this.document()?.metadata?.path ?? '/' ) === '/' );
  });

  protected readonly title:Signal<string> = computed(():string => {
    const title:string = ( this.settings()?.title?.trim() ?? '' );
    return ( title.length > 0 ? title : 'Wiki|Docs' );
  });

  protected readonly breadcrumbs:Signal<ReadonlyArray<BreadcrumbEntry>> = computed<ReadonlyArray<BreadcrumbEntry>>(():BreadcrumbEntry[] => {
    const document:DocumentType | null = this.document();
    if ( ! document ) { return []; }
    const path:string = document.metadata?.path ?? '/';
    if ( ! path || path === '/' ) { return []; }
    const pathParts:string[] = path.split('/').filter((p:string):boolean => p.length > 0);
    let pathCumulative:string = '';
    return pathParts.map((part:string, idx:number):BreadcrumbEntry => {
      pathCumulative += '/' + part;
      return {
        path: pathCumulative,
        label: decodeURIComponent(part),
        isCurrent: idx === ( pathParts.length - 1 )
      } as BreadcrumbEntry;
    });
  });

  protected onNavigationToggle():void {
    this.navigationToggled.emit();
  }

  protected onActionClick(action:ActionItem):void {
    if ( this.isMobile() ) {
      this.showMobileActions.set(false);
    }
    this.actionClicked.emit(action);
  }

  protected onMobileActionsToggle():void {
    this.showMobileActions.update((isOpen:boolean):boolean => ! isOpen);
  }

}
