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

describe('ParserService version 1 extensions', ():void => {
  let marked:Marked;

  beforeEach(():void => {
    const parserService:ParserService = TestBed.inject(ParserService);
    marked = new Marked(
      { gfm: true, breaks: false },
      parserService.createHighlightExtension(),
      parserService.createAlertExtension(),
      parserService.createCollapsibleExtension(),
      parserService.createDirectionExtension(),
      parserService.createVideoExtension(),
      parserService.createColorExtension(),
      parserService.createMonospaceExtension(),
    );
  });

  afterEach(():void => {
    localStorage.removeItem('SETTINGS');
  });

  const render = (markdown:string):string => marked.parse(markdown, { async: false });

  describe('collapsible sections', ():void => {
    it('renders a section with a custom inline summary', ():void => {
      expect(render('+++ Show **more**\nHidden text\n+++')).toBe(
        '<details class="markdown-collapsible">\n<summary>Show <strong>more</strong></summary>\n<p>Hidden text</p>\n</details>\n'
      );
    });

    it('uses a localized default summary', ():void => {
      expect(render('+++\nText\n+++')).toContain('<summary>Click to expand</summary>');
      localStorage.setItem('SETTINGS', JSON.stringify({ localization: 'it' }));
      TestBed.inject(SettingsService).restore();
      expect(render('+++\nText\n+++')).toContain('<summary>Clicca per espandere</summary>');
    });

    it('parses the section body as block markdown', ():void => {
      const html:string = render('+++ Steps\n1. one\n2. two\n\n> [!TIP]\n> Inside\n\n```sh\n+++\n```\n+++');
      expect(html).toMatch(/^<details class="markdown-collapsible">\n<summary>Steps<\/summary>\n<ol>/);
      expect(html).toContain('<div class="markdown-alert markdown-alert-tip">');
      expect(html).toContain('<pre><code class="language-sh">+++\n</code></pre>');
      expect(html).toMatch(/<\/details>\n$/);
    });

    it('ends at the closing marker and interrupts paragraphs', ():void => {
      expect(render('Before\n+++ Title\nInside\n+++\nAfter')).toBe(
        '<p>Before</p>\n<details class="markdown-collapsible">\n<summary>Title</summary>\n<p>Inside</p>\n</details>\n<p>After</p>\n'
      );
    });

    it('nests sections opened with a summary', ():void => {
      expect(render('+++ Outer\n+++ Inner\nText\n+++\nRest\n+++')).toBe(
        '<details class="markdown-collapsible">\n<summary>Outer</summary>\n'
        + '<details class="markdown-collapsible">\n<summary>Inner</summary>\n<p>Text</p>\n</details>\n<p>Rest</p>\n</details>\n'
      );
    });

    it('extends an unclosed section to the end of its container', ():void => {
      expect(render('+++ Open\nText')).toBe('<details class="markdown-collapsible">\n<summary>Open</summary>\n<p>Text</p>\n</details>\n');
      expect(render('> [!NOTE]\n> +++ Quoted\n> Text\n\nOutside')).toContain('<summary>Quoted</summary>\n<p>Text</p>\n</details>\n</div>\n<p>Outside</p>');
    });

    it('ignores other plus sequences', ():void => {
      expect(render('++++\nText')).toBe('<p>++++\nText</p>\n');
      expect(render('a +++ b')).toBe('<p>a +++ b</p>\n');
      expect(render('Text\n++++')).toBe('<p>Text\n++++</p>\n');
    });
  });

  describe('videos', ():void => {
    const iframe = (url:string, title:string):string => `<iframe class="markdown-video" src="${ url }" title="${ title }" loading="lazy" `
      + 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';

    it('embeds YouTube videos', ():void => {
      const embed:string = iframe('https://www.youtube.com/embed/LcuvxJNIgfE', 'YouTube video');
      for ( const url of [
        'https://www.youtube.com/watch?v=LcuvxJNIgfE',
        'https://youtube.com/watch?feature=shared&v=LcuvxJNIgfE&t=42',
        'https://m.youtube.com/watch?v=LcuvxJNIgfE',
        'https://youtu.be/LcuvxJNIgfE?si=abc',
        'https://www.youtube.com/shorts/LcuvxJNIgfE',
        'https://www.youtube.com/live/LcuvxJNIgfE',
        'https://www.youtube-nocookie.com/embed/LcuvxJNIgfE',
      ] ) {
        expect(render(`[video src="${ url }"]`)).toBe(`<p>${ embed }</p>\n`);
      }
    });

    it('embeds Vimeo videos', ():void => {
      expect(render('[video src="https://vimeo.com/980151652"]')).toBe(`<p>${ iframe('https://player.vimeo.com/video/980151652', 'Vimeo video') }</p>\n`);
      expect(render('[video src="https://vimeo.com/channels/staffpicks/980151652"]')).toContain('src="https://player.vimeo.com/video/980151652"');
      expect(render('[video src="https://vimeo.com/980151652/1a2b3c4d5e"]')).toContain('src="https://player.vimeo.com/video/980151652?h=1a2b3c4d5e"');
      expect(render('[video src="https://player.vimeo.com/video/980151652?h=1a2b3c4d5e&autoplay=1"]')).toContain('src="https://player.vimeo.com/video/980151652?h=1a2b3c4d5e"');
    });

    it('accepts extra attributes and inline placement', ():void => {
      expect(render('Watch [video width="640" src="https://youtu.be/LcuvxJNIgfE"] now')).toBe(
        `<p>Watch ${ iframe('https://www.youtube.com/embed/LcuvxJNIgfE', 'YouTube video') } now</p>\n`
      );
    });

    it('localizes the frame title', ():void => {
      localStorage.setItem('SETTINGS', JSON.stringify({ localization: 'it' }));
      TestBed.inject(SettingsService).restore();
      expect(render('[video src="https://vimeo.com/980151652"]')).toContain('title="Video Vimeo"');
    });

    it('leaves unsupported sources as text', ():void => {
      expect(render('[video src="https://example.com/watch?v=LcuvxJNIgfE"]')).toMatch(/^<p>\[video src=&quot;<a href="https:\/\/example\.com\//);
      expect(render('[video src="https://www.youtube.com.evil.test/watch?v=LcuvxJNIgfE"]')).not.toContain('<iframe');
      expect(render('[video src="javascript:alert(1)//youtube.com/watch?v=LcuvxJNIgfE"]')).not.toContain('<iframe');
      expect(render('[video src="https://www.youtube.com/watch?v=short"]')).not.toContain('<iframe');
      expect(render('`[video src="https://youtu.be/LcuvxJNIgfE"]`')).toBe('<p><code>[video src=&quot;https://youtu.be/LcuvxJNIgfE&quot;]</code></p>\n');
    });
  });

  describe('colors', ():void => {
    it('colors inline text', ():void => {
      expect(render('[color=#ff0000]Red[/color], [color=green]**Green**[/color] and [color=rgb(0, 0, 255)]Blue[/color].')).toBe(
        '<p><span style="color: #ff0000">Red</span>, <span style="color: green"><strong>Green</strong></span> and <span style="color: rgb(0, 0, 255)">Blue</span>.</p>\n'
      );
    });

    it('supports nested colors across lines', ():void => {
      expect(render('[color=red]a [color=#00f]b[/color]\nc[/color]')).toBe(
        '<p><span style="color: red">a <span style="color: #00f">b</span>\nc</span></p>\n'
      );
    });

    it('leaves invalid or unclosed colors as text', ():void => {
      expect(render('[color=red;background:url(x)]Text[/color]')).toBe('<p>[color=red;background:url(x)]Text[/color]</p>\n');
      expect(render('[color="red"]Text[/color]')).not.toContain('<span');
      expect(render('[color=red]Text')).toBe('<p>[color=red]Text</p>\n');
    });
  });

  describe('monospace', ():void => {
    it('renders inline monospace text', ():void => {
      expect(render('Use [mono]ls *-la*[/mono] here')).toBe('<p>Use <span class="markdown-monospace">ls <em>-la</em></span> here</p>\n');
    });

    it('leaves unclosed tags as text', ():void => {
      expect(render('[mono]Text')).toBe('<p>[mono]Text</p>\n');
    });
  });

  describe('text direction', ():void => {
    it('renders a forced direction block', ():void => {
      expect(render('[rtl]Forced RTL example.[/rtl]')).toBe('<div class="markdown-direction" dir="rtl">\n<p>Forced RTL example.</p>\n</div>\n');
      expect(render('[ltr]\n# Title\n\n- item\n[/ltr]\nAfter')).toBe('<div class="markdown-direction" dir="ltr">\n<h1>Title</h1>\n<ul>\n<li>item</li>\n</ul>\n</div>\n<p>After</p>\n');
    });

    it('renders forced direction inline', ():void => {
      expect(render('Name: [rtl]**سلام**[/rtl] (Persian)')).toBe('<p>Name: <span dir="rtl"><strong>سلام</strong></span> (Persian)</p>\n');
      expect(render('[rtl]a[/rtl] b')).toBe('<p><span dir="rtl">a</span> b</p>\n');
      expect(render('a [rtl]b[/rtl]\nc')).toBe('<p>a <span dir="rtl">b</span>\nc</p>\n');
    });

    it('supports nested directions', ():void => {
      expect(render('[rtl]a [ltr]b[/ltr] c[/rtl]')).toBe('<div class="markdown-direction" dir="rtl">\n<p>a <span dir="ltr">b</span> c</p>\n</div>\n');
    });

    it('leaves unclosed tags as text', ():void => {
      expect(render('[rtl]Text\n\nMore')).toBe('<p>[rtl]Text</p>\n<p>More</p>\n');
    });
  });
});
