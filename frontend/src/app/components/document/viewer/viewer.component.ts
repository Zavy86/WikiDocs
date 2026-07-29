import { MarkdownComponent } from 'ngx-markdown';
import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { ParserService } from 'src/app/services/parser.service';
import { AttachmentType, ContentType, MetadataType } from 'src/app/types';

@Component({
  standalone: true,
  selector: 'app-document-viewer',
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.scss',
  imports: [ MatChipsModule, MarkdownComponent ],
})
export class DocumentViewerComponent {
  private readonly router:Router = inject(Router);
  private readonly parserService:ParserService = inject(ParserService);
  readonly metadata:InputSignal<MetadataType> = input.required<MetadataType>();
  readonly content:InputSignal<ContentType> = input.required<ContentType>();
  readonly attachments:InputSignal<AttachmentType[]> = input.required<AttachmentType[]>();
  protected readonly markdown:Signal<string> = computed(():string => this.parserService.prepareDocument(
    this.content()?.raw ?? '',
    this.attachments() ?? [],
    this.metadata()?.path ?? '/',
  ));

  protected onMarkdownClick(event:MouseEvent):void {
    if ( event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ) { return; }
    const target:EventTarget | null = event.target;
    if ( ! ( target instanceof Element ) ) { return; }
    const anchor:HTMLAnchorElement | null = target.closest('a');
    if ( ! anchor || anchor.getAttribute('target') === '_blank' ) { return; }
    const rawHref:string = anchor.getAttribute('href')?.trim() ?? '';
    if ( ! rawHref || rawHref.startsWith('#') || rawHref.startsWith('about:invalid#') ) { return; }
    let resolvedUrl:URL;
    try {
      resolvedUrl = new URL(rawHref, window.location.origin);
    } catch {
      return;
    }
    if ( ! this.isInternalWikiUrl(resolvedUrl) ) { return; }
    event.preventDefault();
    void this.router.navigateByUrl(`${ resolvedUrl.pathname }${ resolvedUrl.search }${ resolvedUrl.hash }`);
  }

  private isInternalWikiUrl(url:URL):boolean {
    if ( url.origin !== window.location.origin ) { return false; }
    if ( url.pathname.startsWith('/api/') || url.pathname === '/attachment' || url.pathname.startsWith('/attachment/') ) { return false; }
    return ! this.hasFileExtension(url.pathname);
  }

  private hasFileExtension(urlPath:string):boolean {
    const normalized:string = urlPath.replace(/\\/g, '/');
    const lastSegment:string = normalized.split('/').filter(Boolean).at(-1) ?? '';
    const lastDot:number = lastSegment.lastIndexOf('.');
    return ( lastDot > 0 && lastDot < ( lastSegment.length - 1 ) );
  }

}
