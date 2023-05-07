# Parsedown Checkbox

An extension of [ParsedownExtra](https://github.com/erusev/parsedown-extra) and [Parsedown](http://parsedown.org/) that adds support for task list

## Installation

```bash
composer require leblanc-simon/parsedown-checkbox
```

## Example

```php
<?php

require_once __DIR__.'/vendor/autoload.php';

$parsedown = new ParsedownCheckbox();

echo $parsedown->text('
- [ ] Add a pull request
- [x] Check the issues
');
```

Prints :

- [ ] Add a pull request
- [x] Check the issues

## License

- [MIT](http://opensource.org/licenses/MIT)

## Author

Simon Leblanc <contact@leblanc-simon.eu>

