<p align="center">
  <a href="https://github.com/BenjaminHoegh/ParsedownExtended">
    <!--<img src="https://github.com/BenjaminHoegh/Chameleon/blob/main/docs/assets/images/logo/logo.svg" alt="" width=129 height=129>-->
    <img alt="ParsedownExtended" src="https://github.com/BenjaminHoegh/ParsedownExtended/blob/gh-pages/img/parsedownExtended.png" height="330" />
  </a>

  <h3 align="center">Parsedown Extended</h3>

  <p align="center">
    <a href="https://benjaminhoegh.github.io/ParsedownExtended/"><strong>Explore Documentation »</strong></a>
    <br>
    <br>
    <a href="https://github.com/BenjaminHoegh/ParsedownExtended/issues/new?template=bug_report.md">Report bug</a>
    ·
    <a href="https://github.com/BenjaminHoegh/ParsedownExtended/issues/new?template=feature_request.md&labels=feature">Request feature</a>
    ·
    <a href="https://github.com/BenjaminHoegh/ParsedownExtended/discussions">Discussions</a>
  </p>

</p>

<br>

![GitHub Release](https://img.shields.io/github/v/release/BenjaminHoegh/ParsedownExtended?style=flat-square) 
![Packagist Downloads](https://img.shields.io/packagist/dt/benjaminhoegh/parsedown-extended?style=flat-square)
![GitHub License](https://img.shields.io/github/license/BenjaminHoegh/ParsedownExtended?style=flat-square)


Table of contents

- [Introduction](#introduction)
- [Features](#features)
- [Getting started](#getting-started)
- [Bugs and feature requests](#bugs-and-feature-requests)
- [Contributing](#contributing)
- [Community](#community)
- [Copyright and license](#copyright-and-license)

## Introduction

ParsedownExtended is an extention for Parsedown, offering additional features and functionalities. It is designed to provide an easy-to-use Markdown parsing solution while extending the capabilities of the base Parsedown library.

## Features

ParsedownExtended includes a variety of features to enhance your Markdown parsing experience:

- **Task Lists:** Create simple task lists in Markdown.
- **Smartypants:** Automatically convert straight quotes to curly, dashes to en-dash and em-dash, etc.
- **Emojis:** Support for rendering emojis.
- **Heading Permalinks:** Generate permalinks for your headings.
- **Table of Contents:** Automatically generate a table of contents based on headings.
- **Keystrokes:** Render keystroke combinations.
- **Marking:** Mark text within your documents for emphasis or distinction.
- **Superscript and Subscript:** Render text as superscript or subscript.
- **Diagrams Syntax Support:** Recognizes diagram syntax for integration with libraries like mermaid.js and chart.js.
- **LaTeX Syntax Support:** Detects LaTeX syntax, suitable for mathematical expressions, to be rendered with libraries like KaTeX.js.
- **Predefined Abbreviations:** Define and use abbreviations easily.
- **Customizable Options:** Extensive options for customizing each Markdown element.
- **Additional Features:** ParsedownExtended continuously evolves, adding more features over time.

## Getting started

### Manual
Download the source code from the latest release
You must include `parsedown.php` 1.7+
Include `ParsedownExtended.php`

```php
require 'Parsedown.php';
require 'ParsedownExtra.php'; // optional
require 'ParsedownExtended.php';

$ParsedownExtended = new ParsedownExtended();

echo $ParsedownExtended->text('Hello _Parsedown_!'); # prints: <p>Hello <em>Parsedown</em>!</p>
// you can also parse inline markdown only
echo $ParsedownExtended->line('Hello _Parsedown_!'); # prints: Hello <em>Parsedown</em>!
```

### Using composer

From the command line interface, navigate to your project folder then run this command:
```shell
composer require benjaminhoegh/parsedown-extended
```
Then require the auto-loader file:
```php
require 'vendor/autoload.php';

$ParsedownExtended = new ParsedownExtended();

echo $ParsedownExtended->text('Hello _Parsedown_!'); # prints: <p>Hello <em>Parsedown</em>!</p>
// you can also parse inline markdown only
echo $ParsedownExtended->line('Hello _Parsedown_!'); # prints: Hello <em>Parsedown</em>!
```

## Bugs and feature requests

Have a bug or a feature request? Please first read the [issue guidelines](https://github.com/BenjaminHoegh/ParsedownExtended/blob/main/.github/CONTRIBUTING.md#using-the-issue-tracker) and search for existing and closed issues. If your problem or idea is not addressed yet, [please open a new issue](https://github.com/BenjaminHoegh/ParsedownExtended/issues/new/choose).

## Contributing

Please read through our [contributing guidelines](https://github.com/BenjaminHoegh/ParsedownExtended/blob/main/.github/CONTRIBUTING.md). Included are directions for opening issues, coding standards, and notes on development.

All PHP should conform to the [Code Guide](https://www.php-fig.org/psr/psr-12/).

## Community

Get updates on ParsedownExtended's development and chat with the project maintainers and community members.

- Join [GitHub discussions](https://github.com/BenjaminHoegh/ParsedownExtended/discussions).

## Copyright and license

Code and documentation copyright 2024 the [ParsedownExtended Authors](https://github.com/BenjaminHoegh/ParsedownExtended/graphs/contributors). Code released under the [MIT License](https://github.com/BenjaminHoegh/ParsedownExtended/blob/main/LICENSE.md). Docs released under [Creative Commons](https://github.com/BenjaminHoegh/ParsedownExtended/blob/main/docs/LICENSE.md).
