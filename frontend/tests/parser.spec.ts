import { Marked } from 'marked';
import { TestBed } from '@angular/core/testing';
import { ParserService } from 'src/app/services/parser.service';
import { SettingsService } from 'src/app/services/settings.service';

describe('ParserService alert extension', ():void => {
  let marked:Marked;

  beforeEach(():void => {
    const parserService:ParserService = TestBed.inject(ParserService);
    marked = new Marked({ gfm: true, breaks: false }, parserService.createHighlightExtension(), parserService.createAlertExtension());
  });

  afterEach(():void => {
    localStorage.removeItem('SETTINGS');
  });

  const render = (markdown:string):string => marked.parse(markdown, { async: false });

  it('renders a GitHub alert with its default title', ():void => {
    expect(render('> [!NOTE]\n> Useful information.')).toBe(
      '<div class="markdown-alert markdown-alert-note">\n<p class="markdown-alert-title">Note</p>\n<p>Useful information.</p>\n</div>\n'
    );
  });

  it('localizes the default title in the active language', ():void => {
    localStorage.setItem('SETTINGS', JSON.stringify({ localization: 'it' }));
    TestBed.inject(SettingsService).restore();
    expect(render('> [!NOTE]\n> Text')).toContain('<p class="markdown-alert-title">Nota</p>');
  });

  it('supports every alert variant case-insensitively', ():void => {
    const variants:Readonly<Record<string, string>> = {
      CAUTION: 'Caution',
      important: 'Important',
      Note: 'Note',
      QUESTION: 'Question',
      tip: 'Tip',
      Warning: 'Warning',
    };
    for ( const [ marker, title ] of Object.entries(variants) ) {
      expect(render(`> [!${ marker }]\n> Text`)).toContain(`<div class="markdown-alert markdown-alert-${ marker.toLowerCase() }">\n<p class="markdown-alert-title">${ title }</p>`);
    }
  });

  it('uses the text after the marker as a custom inline title', ():void => {
    expect(render('> [!WARNING] Back up **first**\n> Text')).toContain('<p class="markdown-alert-title">Back up <strong>first</strong></p>');
  });

  it('parses the alert body as block markdown', ():void => {
    const html:string = render('> [!TIP]\n>\n> Intro with ==mark==\n>\n> - one\n> - two\n>\n> ```js\n> const answer = 42;\n> ```');
    expect(html).toMatch(/^<div class="markdown-alert markdown-alert-tip">\n<p class="markdown-alert-title">Tip<\/p>\n/);
    expect(html).toMatch(/<\/div>\n$/);
    expect(html).toContain('<p>Intro with <mark>mark</mark></p>');
    expect(html).toContain('<ul>\n<li>one</li>\n<li>two</li>\n</ul>');
    expect(html).toContain('<pre><code class="language-js">const answer = 42;\n</code></pre>');
  });

  it('ends the alert at the first line outside the quote', ():void => {
    expect(render('> [!IMPORTANT]\n> Inside\n\nOutside')).toBe(
      '<div class="markdown-alert markdown-alert-important">\n<p class="markdown-alert-title">Important</p>\n<p>Inside</p>\n</div>\n<p>Outside</p>\n'
    );
  });

  it('interrupts a preceding paragraph', ():void => {
    expect(render('Paragraph\n> [!NOTE]\n> Text')).toBe(
      '<p>Paragraph</p>\n<div class="markdown-alert markdown-alert-note">\n<p class="markdown-alert-title">Note</p>\n<p>Text</p>\n</div>\n'
    );
  });

  it('resolves reference links defined after the alert', ():void => {
    expect(render('> [!NOTE] See [docs]\n> Read the [guide]\n\n[docs]: https://example.com/docs\n[guide]: https://example.com/guide')).toContain(
      '<p class="markdown-alert-title">See <a href="https://example.com/docs">docs</a></p>\n<p>Read the <a href="https://example.com/guide">guide</a></p>'
    );
  });

  it('renders alerts nested in lists and blockquotes', ():void => {
    expect(render('- > [!TIP]\n  > Listed')).toContain('<li><div class="markdown-alert markdown-alert-tip">');
    expect(render('> > [!CAUTION]\n> > Nested')).toContain('<blockquote>\n<div class="markdown-alert markdown-alert-caution">');
  });

  it('keeps regular and unknown blockquotes unchanged', ():void => {
    expect(render('> Quote')).toBe('<blockquote>\n<p>Quote</p>\n</blockquote>\n');
    expect(render('> [!UNKNOWN]\n> Quote')).toBe('<blockquote>\n<p>[!UNKNOWN]\nQuote</p>\n</blockquote>\n');
    expect(render('```\n> [!NOTE]\n```')).toBe('<pre><code>&gt; [!NOTE]\n</code></pre>\n');
  });
});
