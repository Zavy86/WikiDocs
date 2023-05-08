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

[![Github All Releases](https://img.shields.io/github/release/BenjaminHoegh/ParsedownExtended.svg?style=flat-square)](https://github.com/BenjaminHoegh/ParsedownExtended/releases) [![GitHub](https://img.shields.io/github/license/BenjaminHoegh/ParsedownExtended?style=flat-square)](https://github.com/BenjaminHoegh/ParsedownExtended/blob/main/LICENSE.md)

Table of contents

- [Getting started](#getting-started)
- [Bugs and feature requests](#bugs-and-feature-requests)
- [Contributing](#contributing)
- [Community](#community)
- [Copyright and license](#copyright-and-license)

## Features
- Task
- Smartypants
- Emojis
- Heading permalink
- Table of content
- Keystrokes
- Highlight
- Super and subscript
- Diagrams
- LaTeX
- Predefined abbreviation
- Options for every element of markdown
- And more...

## Getting started

### Manual
Download the source code from the latest release
You must include `parsedown.php` 1.8+
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

Code and documentation copyright 2021 the [ParsedownExtended Authors](https://github.com/BenjaminHoegh/ParsedownExtended/graphs/contributors). Code released under the [MIT License](https://github.com/BenjaminHoegh/ParsedownExtended/blob/main/LICENSE.md). Docs released under [Creative Commons](https://github.com/BenjaminHoegh/ParsedownExtended/blob/main/docs/LICENSE.md).
