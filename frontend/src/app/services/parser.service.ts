import type { MarkedExtension, Tokens } from 'marked';
import { Injectable } from '@angular/core';
import { buildBackendUrl } from 'src/app/app.backend';
import { AttachmentType } from 'src/app/types';

@Injectable({ providedIn: 'root' })
export class ParserService {

  private markdownPluginsPromise:Promise<void> | null = null;

  public loadMarkdownPlugins():Promise<void> {
    if ( this.markdownPluginsPromise ) { return this.markdownPluginsPromise; }
    this.markdownPluginsPromise = this.initializeMarkdownPlugins();
    return this.markdownPluginsPromise;
  }

  public prepareDocument(markdown:string, attachments:AttachmentType[], currentPath:string):string {
    const markdownWithoutFrontMatter:string = markdown.replace(/^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, '');
    return this.rewriteMarkdownAssetUrls(markdownWithoutFrontMatter, attachments, currentPath);
  }

  public createHighlightExtension():MarkedExtension {
    return {
      extensions: [ {
        name: 'highlight',
        level: 'inline',
        start: (source:string):number => source.indexOf('=='),
        tokenizer: (source:string):Tokens.Generic | undefined => {
          const match:RegExpExecArray | null = /^==([^=\n]+)==/.exec(source);
          if ( ! match ) { return undefined; }
          return { type: 'highlight', raw: match[ 0 ], text: match[ 1 ] };
        },
        renderer: (token:Tokens.Generic):string => {
          const text:unknown = token[ 'text' ];
          return `<mark>${ this.escapeHtml(typeof text === 'string' ? text : '') }</mark>`;
        },
      } ],
    };
  }

  private async initializeMarkdownPlugins():Promise<void> {
    const [ markedModule, prismModule, emojiModule, katexModule, mermaidModule, clipboardModule ] = await Promise.all([
      import('marked'),
      import('prismjs'),
      import('emoji-toolkit'),
      import('katex'),
      import('mermaid'),
      import('clipboard'),
    ]);

    markedModule.marked.use(this.createHighlightExtension());

    ( globalThis as { Prism?:unknown } ).Prism = prismModule.default;

    await Promise.all([
      import('prismjs/components/prism-bash.min.js'),
      import('prismjs/components/prism-css.min.js'),
      import('prismjs/components/prism-javascript.min.js'),
      import('prismjs/components/prism-json.min.js'),
      import('prismjs/components/prism-markdown.min.js'),
      import('prismjs/components/prism-markup.min.js'),
      import('prismjs/components/prism-sql.min.js'),
      import('prismjs/components/prism-typescript.min.js'),
      import('prismjs/components/prism-yaml.min.js'),
    ]);

    ( globalThis as { joypixels?:unknown } ).joypixels = emojiModule.default;
    ( globalThis as { katex?:unknown } ).katex = katexModule.default;
    ( globalThis as { mermaid?:unknown } ).mermaid = mermaidModule.default;
    ( globalThis as { ClipboardJS?:unknown } ).ClipboardJS = clipboardModule.default;
  }

  private rewriteMarkdownAssetUrls(markdown:string, attachments:AttachmentType[], currentPath:string):string {
    const attachmentIndex:Map<string, AttachmentType> = this.indexAttachmentsByFile(attachments);
    return markdown.replace(
      /(!?)\[([^\]]*)\]\(([^)]+)\)/g,
      (fullMatch:string, imageMarker:string, text:string, destination:string):string => {
        const parsedDestination = this.parseMarkdownDestination(destination);
        if ( ! parsedDestination ) { return fullMatch; }
        const { base } = this.splitUrlBaseAndSuffix(parsedDestination.url);
        if ( ! this.hasFileExtension(base) ) {
          return this.rewriteWikiLink(fullMatch, imageMarker, text, parsedDestination, currentPath);
        }
        const rewriteResult = this.rewriteUrl(parsedDestination.url, attachmentIndex);
        const isImage:boolean = ( imageMarker === '!' );
        if ( isImage ) {
          if ( rewriteResult.type === 'unchanged' ) { return fullMatch; }
          if ( rewriteResult.type === 'missing' ) { return `![missing attachment: ${ rewriteResult.file }]`; }
          return `${ imageMarker }[${ text }](${ this.formatMarkdownDestination(rewriteResult.url, parsedDestination.wrappedInAngleBrackets, parsedDestination.tail) })`;
        }
        let href:string = parsedDestination.url;
        let linkText:string = text;
        if ( rewriteResult.type === 'missing' ) {
          href = 'about:invalid#attachment-not-found';
          linkText = text.includes('(missing attachment)') ? text : `${ text } (missing attachment)`;
        } else if ( rewriteResult.type === 'rewritten' ) {
          href = rewriteResult.url;
        }
        const title:string | null = this.parseMarkdownLinkTitle(parsedDestination.tail);
        const titleAttribute:string = title ? ` title="${ this.escapeHtmlAttribute(title) }"` : '';
        return `<a href="${ this.escapeHtmlAttribute(href) }" target="_blank" rel="noopener noreferrer"${ titleAttribute }>${ this.escapeHtml(linkText) }</a>`;
      }
    );
  }

  private rewriteWikiLink(fullMatch:string, imageMarker:string, text:string, parsedDestination:{
    readonly url:string;
    readonly tail:string;
    readonly wrappedInAngleBrackets:boolean;
  }, currentPath:string):string {
    const url:string = parsedDestination.url.trim();
    if ( imageMarker === '!' ) { return fullMatch; }
    if ( this.isUnsupportedParentRelativeUrl(url) ) {
      const errorText:string = text.includes('(unsupported ../ link)') ? text : `${ text } (unsupported ../ link)`;
      return `[${ errorText }](about:invalid#unsupported-parent-relative-link${ parsedDestination.tail })`;
    }
    const resolvedWikiUrl:string | null = this.resolveWikiUrl(url, currentPath);
    if ( ! resolvedWikiUrl ) { return fullMatch; }
    return `[${ text }](${ this.formatMarkdownDestination(resolvedWikiUrl, parsedDestination.wrappedInAngleBrackets, parsedDestination.tail) })`;
  }

  private indexAttachmentsByFile(attachments:AttachmentType[]):Map<string, AttachmentType> {
    const byFile = new Map<string, AttachmentType>();
    for ( const attachment of attachments ) {
      const key:string = attachment.file.toLowerCase();
      if ( ! byFile.has(key) ) { byFile.set(key, attachment); }
    }
    return byFile;
  }

  private parseMarkdownDestination(destination:string):{ readonly url:string; readonly tail:string; readonly wrappedInAngleBrackets:boolean; } | null {
    const trimmedDestination:string = destination.trim();
    if ( ! trimmedDestination ) { return null; }
    if ( trimmedDestination.startsWith('<') ) {
      const closingIndex:number = trimmedDestination.indexOf('>');
      if ( closingIndex === -1 ) { return null; }
      return { url: trimmedDestination.slice(1, closingIndex), tail: trimmedDestination.slice(closingIndex + 1), wrappedInAngleBrackets: true };
    }
    const firstSpaceMatch:RegExpExecArray | null = /\s/.exec(trimmedDestination);
    if ( ! firstSpaceMatch?.index ) { return { url: trimmedDestination, tail: '', wrappedInAngleBrackets: false }; }
    const firstSpaceIndex:number = firstSpaceMatch.index;
    return { url: trimmedDestination.slice(0, firstSpaceIndex), tail: trimmedDestination.slice(firstSpaceIndex), wrappedInAngleBrackets: false };
  }

  private formatMarkdownDestination(url:string, wrappedInAngleBrackets:boolean, tail:string):string {
    return wrappedInAngleBrackets ? `<${ url }>${ tail }` : `${ url }${ tail }`;
  }

  private hasFileExtension(urlPath:string):boolean {
    const normalized:string = urlPath.replace(/\\/g, '/');
    const lastSegment:string = normalized.split('/').filter(Boolean).at(-1) ?? '';
    const lastDot:number = lastSegment.lastIndexOf('.');
    return ( lastDot > 0 && lastDot < ( lastSegment.length - 1 ) );
  }

  private resolveWikiUrl(url:string, currentPath:string):string | null {
    const trimmedUrl:string = url.trim();
    if ( ! trimmedUrl || trimmedUrl.startsWith('/') || trimmedUrl.startsWith('#') || trimmedUrl.startsWith('//') ) { return null; }
    if ( /^[A-Za-z][A-Za-z\d+.-]*:/.test(trimmedUrl) || this.isUnsupportedParentRelativeUrl(trimmedUrl) ) { return null; }
    const normalizedCurrentPath:string = this.normalizeWikiPath(currentPath);
    const relativePath:string = trimmedUrl.startsWith('./') ? trimmedUrl.replace(/^\.\/+/, '') : trimmedUrl;
    const normalizedRelativePath:string = relativePath.replace(/^\/+/, '').replace(/\/+/g, '/');
    if ( ! normalizedRelativePath ) { return normalizedCurrentPath; }
    const base:string = ( normalizedCurrentPath === '/' ? '' : normalizedCurrentPath );
    return `${ base }/${ normalizedRelativePath }`;
  }

  private normalizeWikiPath(path:string):string {
    const normalized:string = path.trim().replace(/\\/g, '/').replace(/\/+/g, '/');
    if ( ! normalized || normalized === '/' ) { return '/'; }
    const withLeadingSlash:string = normalized.startsWith('/') ? normalized : `/${ normalized }`;
    return withLeadingSlash.replace(/\/+$/g, '');
  }

  private isUnsupportedParentRelativeUrl(url:string):boolean { return /^\.\.\//.test(url.trim()); }

  private parseMarkdownLinkTitle(tail:string):string | null {
    const trimmedTail:string = tail.trim();
    if ( ! trimmedTail ) { return null; }
    const quotedTitleMatch:RegExpMatchArray | null = trimmedTail.match(/^(['"])([\s\S]*)\1$/);
    return quotedTitleMatch?.[ 2 ] ?? null;
  }

  private escapeHtml(value:string):string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private escapeHtmlAttribute(value:string):string {
    return this.escapeHtml(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  private rewriteUrl(sourceUrl:string, attachmentsByFile:Map<string, AttachmentType>):{ readonly type:'unchanged' } | { readonly type:'missing'; readonly file:string } | {
    readonly type:'rewritten';
    readonly url:string
  } {
    const trimmedUrl:string = sourceUrl.trim();
    if ( ! this.isLocalRelativeUrl(trimmedUrl) ) { return { type: 'unchanged' }; }
    const { base, suffix } = this.splitUrlBaseAndSuffix(trimmedUrl);
    const normalizedPath:string = base.replace(/\\/g, '/');
    const fileName:string = normalizedPath.split('/').filter(Boolean).at(-1) ?? '';
    if ( ! fileName ) { return { type: 'unchanged' }; }
    const attachment:AttachmentType | undefined = attachmentsByFile.get(fileName.toLowerCase());
    if ( ! attachment ) { return { type: 'missing', file: fileName }; }
    const attachmentUrl:string = buildBackendUrl(`/attachment?path=${ encodeURIComponent(attachment.path) }&file=${ encodeURIComponent(attachment.file) }&token=${ encodeURIComponent(attachment.token) }`);
    return { type: 'rewritten', url: `${ attachmentUrl }${ suffix }` };
  }

  private splitUrlBaseAndSuffix(url:string):{ readonly base:string; readonly suffix:string } {
    const hashIndex:number = url.indexOf('#');
    const queryIndex:number = url.indexOf('?');
    const splitIndex:number = [ hashIndex, queryIndex ].filter((index:number):boolean => index >= 0).reduce((min:number, index:number):number => Math.min(min, index), Number.POSITIVE_INFINITY);
    return Number.isFinite(splitIndex) ? { base: url.slice(0, splitIndex), suffix: url.slice(splitIndex) } : { base: url, suffix: '' };
  }

  private isLocalRelativeUrl(url:string):boolean {
    return !! url && ! url.startsWith('#') && ! url.startsWith('/') && ! url.startsWith('//') && ! /^[A-Za-z][A-Za-z\d+.-]*:/.test(url);
  }

}
