import type { MarkedExtension, RendererThis, Token, Tokens, TokenizerThis } from 'marked';
import { inject, Injectable } from '@angular/core';
import { buildBackendUrl } from 'src/app/app.backend';
import { LocalizationService } from 'src/app/services/localization.service';
import { AttachmentType } from 'src/app/types';

const alertVariants = [ 'caution', 'important', 'note', 'question', 'tip', 'warning' ] as const;

type AlertVariant = typeof alertVariants[number];

type VideoEmbed = { readonly provider:string; readonly url:string };

const colorPattern:RegExp = /^(?:#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})|[a-z]+|(?:rgb|hsl)a?\([\d\s.,%/a-z+-]*\))$/i;

// marked passes block start functions the source without its first character, so a match is only a valid block start
// when it follows a line break.
const findLineStart = (source:string, pattern:RegExp):number | undefined => {
  const match:RegExpExecArray | null = pattern.exec(source);
  return match ? match.index + 1 : undefined;
};

const findClosingTag = (source:string, name:string, offset:number):number => {
  const tagPattern:RegExp = new RegExp(String.raw`\[(/?)${ name }(?:=[^\]\n]*)?\]`, 'g');
  tagPattern.lastIndex = offset;
  let depth:number = 1;
  for ( let tag:RegExpExecArray | null = tagPattern.exec(source); tag; tag = tagPattern.exec(source) ) {
    depth += tag[ 1 ] ? -1 : 1;
    if ( depth === 0 ) { return tag.index; }
  }
  return -1;
};

@Injectable({ providedIn: 'root' })
export class ParserService {

  private readonly localizationService:LocalizationService = inject(LocalizationService);
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

  public createAlertExtension():MarkedExtension {
    const markerPattern:RegExp = new RegExp(String.raw`^ {0,3}>[ \t]?\[!(${ alertVariants.join('|') })\][ \t]*([^\n]*)(?:\n|$)`, 'i');
    const getDefaultTitle = (variant:AlertVariant):string => this.escapeHtml(this.localizationService.getText(`document.alerts.${ variant }`));
    return {
      extensions: [ {
        name: 'alert',
        level: 'block',
        start: (source:string):number | undefined => /^ {0,3}>[ \t]?\[!/m.exec(source)?.index,
        tokenizer(this:TokenizerThis, source:string):Tokens.Generic | undefined {
          const marker:RegExpExecArray | null = markerPattern.exec(source);
          if ( ! marker ) { return undefined; }
          const quote:string = /^(?: {0,3}>[^\n]*(?:\n|$))*/.exec(source.slice(marker[ 0 ].length))?.[ 0 ] ?? '';
          const body:string = quote.replace(/^ {0,3}> ?/gm, '');
          const top:boolean = this.lexer.state.top;
          this.lexer.state.top = true;
          const tokens:Token[] = this.lexer.blockTokens(body);
          this.lexer.state.top = top;
          return {
            type: 'alert',
            raw: marker[ 0 ] + quote,
            variant: marker[ 1 ].toLowerCase(),
            title: this.lexer.inline(marker[ 2 ].trim()),
            tokens,
          };
        },
        renderer(this:RendererThis, token:Tokens.Generic):string {
          const variant:AlertVariant = token[ 'variant' ];
          const titleTokens:Token[] = token[ 'title' ];
          const title:string = titleTokens.length > 0 ? this.parser.parseInline(titleTokens) : getDefaultTitle(variant);
          return `<div class="markdown-alert markdown-alert-${ variant }">\n<p class="markdown-alert-title">${ title }</p>\n${ this.parser.parse(token.tokens ?? []) }</div>\n`;
        },
        childTokens: [ 'title', 'tokens' ],
      } ],
    };
  }

  public createCollapsibleExtension():MarkedExtension {
    const openingPattern:RegExp = /^ {0,3}\+\+\+(?!\+)[ \t]*([^\n]*?)[ \t]*(?:\n|$)/;
    const markerPattern:RegExp = /^ {0,3}\+\+\+(?!\+)[ \t]*(\S?)/;
    const fencePattern:RegExp = /^ {0,3}(`{3,}|~{3,})([^\n]*)$/;
    const getDefaultSummary = ():string => this.escapeHtml(this.localizationService.getText('document.collapsible.summary'));
    return {
      extensions: [ {
        name: 'collapsible',
        level: 'block',
        start: (source:string):number | undefined => findLineStart(source, /\n {0,3}\+\+\+(?!\+)/),
        tokenizer(this:TokenizerThis, source:string):Tokens.Generic | undefined {
          const opening:RegExpExecArray | null = openingPattern.exec(source);
          if ( ! opening ) { return undefined; }
          let bodyEnd:number = source.length;
          let end:number = source.length;
          let depth:number = 1;
          let fence:string | null = null;
          for ( let position:number = opening[ 0 ].length; position < source.length; ) {
            const lineEnd:number = source.indexOf('\n', position);
            const next:number = lineEnd === -1 ? source.length : lineEnd + 1;
            const line:string = source.slice(position, lineEnd === -1 ? source.length : lineEnd);
            const fenceMatch:RegExpExecArray | null = fencePattern.exec(line);
            if ( fence ) {
              if ( fenceMatch && fenceMatch[ 1 ][ 0 ] === fence[ 0 ] && fenceMatch[ 1 ].length >= fence.length && ! fenceMatch[ 2 ].trim() ) { fence = null; }
            } else if ( fenceMatch ) {
              fence = fenceMatch[ 1 ];
            } else {
              const marker:RegExpExecArray | null = markerPattern.exec(line);
              if ( marker ) { depth += marker[ 1 ] ? 1 : -1; }
              if ( depth === 0 ) {
                bodyEnd = position;
                end = next;
                break;
              }
            }
            position = next;
          }
          const top:boolean = this.lexer.state.top;
          this.lexer.state.top = true;
          const tokens:Token[] = this.lexer.blockTokens(source.slice(opening[ 0 ].length, bodyEnd));
          this.lexer.state.top = top;
          return {
            type: 'collapsible',
            raw: source.slice(0, end),
            summary: this.lexer.inline(opening[ 1 ]),
            tokens,
          };
        },
        renderer(this:RendererThis, token:Tokens.Generic):string {
          const summaryTokens:Token[] = token[ 'summary' ];
          const summary:string = summaryTokens.length > 0 ? this.parser.parseInline(summaryTokens) : getDefaultSummary();
          return `<details class="markdown-collapsible">\n<summary>${ summary }</summary>\n${ this.parser.parse(token.tokens ?? []) }</details>\n`;
        },
        childTokens: [ 'summary', 'tokens' ],
      } ],
    };
  }

  public createVideoExtension():MarkedExtension {
    const getTitle = (provider:string):string => this.escapeHtmlAttribute(this.localizationService.getText('document.video.title', { provider }));
    return {
      extensions: [ {
        name: 'video',
        level: 'inline',
        start: (source:string):number => source.indexOf('[video'),
        tokenizer: (source:string):Tokens.Generic | undefined => {
          const match:RegExpExecArray | null = /^\[video\b[^\]\n]*?\bsrc="([^"\n]*)"[^\]\n]*\]/.exec(source);
          const embed:VideoEmbed | null = match ? this.resolveVideoEmbed(match[ 1 ]) : null;
          if ( ! match || ! embed ) { return undefined; }
          return { type: 'video', raw: match[ 0 ], provider: embed.provider, url: embed.url };
        },
        renderer: (token:Tokens.Generic):string => {
          const url:string = this.escapeHtmlAttribute(token[ 'url' ]);
          const allow:string = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
          return `<iframe class="markdown-video" src="${ url }" title="${ getTitle(token[ 'provider' ]) }" loading="lazy" allow="${ allow }" allowfullscreen></iframe>`;
        },
      } ],
    };
  }

  public createColorExtension():MarkedExtension {
    const escapeAttribute = (value:string):string => this.escapeHtmlAttribute(value);
    return {
      extensions: [ {
        name: 'color',
        level: 'inline',
        start: (source:string):number => source.indexOf('[color='),
        tokenizer(this:TokenizerThis, source:string):Tokens.Generic | undefined {
          const opening:RegExpExecArray | null = /^\[color=([^\]\n]+)\]/.exec(source);
          if ( ! opening || ! colorPattern.test(opening[ 1 ].trim()) ) { return undefined; }
          const closing:number = findClosingTag(source, 'color', opening[ 0 ].length);
          if ( closing === -1 ) { return undefined; }
          return {
            type: 'color',
            raw: source.slice(0, closing + '[/color]'.length),
            color: opening[ 1 ].trim(),
            tokens: this.lexer.inlineTokens(source.slice(opening[ 0 ].length, closing)),
          };
        },
        renderer(this:RendererThis, token:Tokens.Generic):string {
          return `<span style="color: ${ escapeAttribute(token[ 'color' ]) }">${ this.parser.parseInline(token.tokens ?? []) }</span>`;
        },
      } ],
    };
  }

  public createMonospaceExtension():MarkedExtension {
    return {
      extensions: [ {
        name: 'monospace',
        level: 'inline',
        start: (source:string):number => source.indexOf('[mono]'),
        tokenizer(this:TokenizerThis, source:string):Tokens.Generic | undefined {
          if ( ! source.startsWith('[mono]') ) { return undefined; }
          const closing:number = findClosingTag(source, 'mono', '[mono]'.length);
          if ( closing === -1 ) { return undefined; }
          return {
            type: 'monospace',
            raw: source.slice(0, closing + '[/mono]'.length),
            tokens: this.lexer.inlineTokens(source.slice('[mono]'.length, closing)),
          };
        },
        renderer(this:RendererThis, token:Tokens.Generic):string {
          return `<span class="markdown-monospace">${ this.parser.parseInline(token.tokens ?? []) }</span>`;
        },
      } ],
    };
  }

  public createDirectionExtension():MarkedExtension {
    return {
      extensions: [ {
        name: 'directionBlock',
        level: 'block',
        start: (source:string):number | undefined => findLineStart(source, /\n {0,3}\[(?:rtl|ltr)\]/),
        tokenizer(this:TokenizerThis, source:string):Tokens.Generic | undefined {
          const opening:RegExpExecArray | null = /^ {0,3}\[(rtl|ltr)\]/.exec(source);
          if ( ! opening ) { return undefined; }
          const closing:number = findClosingTag(source, opening[ 1 ], opening[ 0 ].length);
          const ending:RegExpExecArray | null = closing === -1 ? null : new RegExp(String.raw`^\[/${ opening[ 1 ] }\][ \t]*(?:\n|$)`).exec(source.slice(closing));
          if ( ! ending ) { return undefined; }
          const top:boolean = this.lexer.state.top;
          this.lexer.state.top = true;
          const tokens:Token[] = this.lexer.blockTokens(source.slice(opening[ 0 ].length, closing));
          this.lexer.state.top = top;
          return { type: 'directionBlock', raw: source.slice(0, closing + ending[ 0 ].length), direction: opening[ 1 ], tokens };
        },
        renderer(this:RendererThis, token:Tokens.Generic):string {
          return `<div class="markdown-direction" dir="${ token[ 'direction' ] }">\n${ this.parser.parse(token.tokens ?? []) }</div>\n`;
        },
      }, {
        name: 'directionInline',
        level: 'inline',
        start: (source:string):number | undefined => /\[(?:rtl|ltr)\]/.exec(source)?.index,
        tokenizer(this:TokenizerThis, source:string):Tokens.Generic | undefined {
          const opening:RegExpExecArray | null = /^\[(rtl|ltr)\]/.exec(source);
          if ( ! opening ) { return undefined; }
          const closing:number = findClosingTag(source, opening[ 1 ], opening[ 0 ].length);
          if ( closing === -1 ) { return undefined; }
          return {
            type: 'directionInline',
            raw: source.slice(0, closing + `[/${ opening[ 1 ] }]`.length),
            direction: opening[ 1 ],
            tokens: this.lexer.inlineTokens(source.slice(opening[ 0 ].length, closing)),
          };
        },
        renderer(this:RendererThis, token:Tokens.Generic):string {
          return `<span dir="${ token[ 'direction' ] }">${ this.parser.parseInline(token.tokens ?? []) }</span>`;
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

    markedModule.marked.use(
      this.createHighlightExtension(),
      this.createAlertExtension(),
      this.createCollapsibleExtension(),
      this.createDirectionExtension(),
      this.createVideoExtension(),
      this.createColorExtension(),
      this.createMonospaceExtension(),
    );

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

  private resolveVideoEmbed(source:string):VideoEmbed | null {
    let url:URL;
    try {
      url = new URL(source.trim());
    } catch {
      return null;
    }
    if ( url.protocol !== 'https:' && url.protocol !== 'http:' ) { return null; }
    const host:string = url.hostname.toLowerCase().replace(/^(?:www|m)\./, '');
    if ( host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'youtu.be' ) {
      const id:string | null | undefined = host === 'youtu.be'
        ? /^\/([\w-]+)\/?$/.exec(url.pathname)?.[ 1 ]
        : url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:embed|shorts|live)\/([\w-]+)\/?$/.exec(url.pathname)?.[ 1 ];
      return id && /^[\w-]{11}$/.test(id) ? { provider: 'YouTube', url: `https://www.youtube.com/embed/${ id }` } : null;
    }
    if ( host === 'vimeo.com' || host === 'player.vimeo.com' ) {
      const pathPattern:RegExp = host === 'player.vimeo.com'
        ? /^\/video\/(\d+)\/?$/
        : /^\/(?:channels\/[\w-]+\/|groups\/[\w-]+\/videos\/|(?:album|showcase)\/\d+\/video\/)?(\d+)(?:\/([\da-f]+))?\/?$/i;
      const path:RegExpExecArray | null = pathPattern.exec(url.pathname);
      if ( ! path ) { return null; }
      const hash:string | null = path[ 2 ] ?? url.searchParams.get('h');
      const query:string = hash && /^[\da-f]+$/i.test(hash) ? `?h=${ hash }` : '';
      return { provider: 'Vimeo', url: `https://player.vimeo.com/video/${ path[ 1 ] }${ query }` };
    }
    return null;
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
