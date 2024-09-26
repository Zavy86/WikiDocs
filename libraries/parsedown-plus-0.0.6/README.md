# ParsedownPlus

ParsedownPlus is an extension of Parsedown that adds support for custom tags such as colored text, forced RTL/LTR direction, monospace fonts, and video embedding for YouTube and Vimeo. These custom tags are not standard Markdown.

**[GitHub Repository](https://github.com/leomoon-studios/ParsedownPlus)**

## Installation

1. Include the `ParsedownPlus.php` class in your project.
2. (Optional) Create a `config.php` file in the same directory as `ParsedownPlus.php` to define custom colors and fonts. You can use the provided `config-sample.php` as a template.

```php
<?php
// include parsedown libraries
require_once(BASE."libraries/parsedown-1.8.0-beta-6/Parsedown.php");
require_once(BASE."libraries/parsedown-extra-0.8.1/ParsedownExtra.php");
require_once(BASE."libraries/parsedown-extended-1.1.2-modified/ParsedownExtended.php");
require_once(BASE."libraries/parsedown-filter-0.0.1/ParsedownFilter.php");
require_once(BASE."libraries/parsedown-plus-0.0.5/ParsedownPlus.php");

// initialize markdown parser
$PARSER=new ParsedownPlus([
	'typographer' => true,
	'toc' => true,
	'sup' => true,
	'sub' => true
]);

$markdown = "YouTube video: [video src=\"https://www.youtube.com/watch?v=Ta_wxUvvO4c\"]

Vimeo video: [video src=\"https://vimeo.com/423640994\"]

[color=#ff0000]Red[/color], [color=#00FF00]Green[/color], [color=#0000FF]Blue[/color]

[rtl]Forced RTL text.[/rtl]

[mono]Forced monospaced text.[/mono]

;
$html = $PARSER->text($markdown);
echo $html;
```

## Configuration (optional)

### config-sample.php

```php
<?php

return [
    // Define a custom monospace font
    'fonts' => [
        'monospace' => 'Courier New, monospace',
    ],
    // Add predefined colors
    'colors' => [
        'customred' => '#8D021F',
        // Add more colors as needed
    ]
];
```

## Examples

### YouTube Embedding

```markdown
[video src="https://www.youtube.com/watch?v=Ta_wxUvvO4c"]
```

### Vimeo Embedding

```markdown
[video src="https://vimeo.com/423640994"]
```

### Caution Important Warning Tip Question Quotes

```
> [!CAUTION] Caution header
> Caution text...

> [!IMPORTANT] Important header
> Important text...

> [!WARNING] Warning header
> Warning text...

> [!TIP] Tip header
> Tip text...

> [!QUESTION] Question header
> Question text...
```

### Colored Text

```markdown
[color=#ff0000]Red[/color], [color=#00FF00]Green[/color], [color=#0000FF]Blue[/color]
```

Predefined colors can be used like this:

```markdown
Predefined colors: [color=customred]predefined red[/color].
```

### Forced RTL/LTR

```markdown
[rtl]Forced RTL example.[/rtl]
```

### Monospace Font

```markdown
[mono]example[/mono]
```

### Collapsible section
```markdown
+++ Collapsible title (optional)
This is the content for the collapsible section. If title is not defined, it will default to: `Click to expand`
+++
```

## License

ParsedownPlus is licensed under the GPLv3 License. See the `LICENSE` file for more details.

## Contributions
Contributions are welcome! If you have suggestions, bug reports, or feature requests, please open an issue or submit a pull request on the repository. Make sure to follow the project's code of conduct and contribution guidelines. Thank you for helping improve ParsedownPlus!
