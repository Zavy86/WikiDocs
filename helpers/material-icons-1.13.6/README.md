# [material-icons](https://github.com/marella/material-icons) [![Downloads](https://img.shields.io/npm/dm/material-icons)](https://www.npmjs.com/package/material-icons)

Latest icon fonts and CSS for self-hosting material design icons.

> This package is automatically updated, so it will always have the latest icons from Google.

> For Material Symbols, see [`material-symbols`](https://www.npmjs.com/package/material-symbols)
>
> For SVGs, see [`@material-design-icons/svg`](https://www.npmjs.com/package/@material-design-icons/svg)

- [Installation](#installation)
- [Usage](#usage)
- [Available Icons](#available-icons)

## Installation

Install the [latest version][releases] using:

```sh
npm install material-icons@latest
```

> **Note:** If you are upgrading from 0.x to 1.x see the [1.0.0 release notes](https://github.com/marella/material-icons/releases/tag/v1.0.0).

## Usage

Import in JS (example: `src/index.js` in Create React App, `src/main.js` in Vue CLI):

```js
import 'material-icons/iconfont/material-icons.css';
```

or import in CSS (example: `src/styles.css` in Angular CLI):

```css
@import 'material-icons/iconfont/material-icons.css';
```

or import in HTML:

```html
<link href="/path/to/material-icons/iconfont/material-icons.css" rel="stylesheet">
```

To display an icon, use one of the following:

```html
<span class="material-icons">pie_chart</span>          <!-- Filled -->
<span class="material-icons-outlined">pie_chart</span> <!-- Outlined -->
<span class="material-icons-round">pie_chart</span>    <!-- Round -->
<span class="material-icons-sharp">pie_chart</span>    <!-- Sharp -->
<span class="material-icons-two-tone">pie_chart</span> <!-- Two Tone -->
```

### Reducing Build Size

The default `material-icons.css` includes CSS for all fonts. This may cause build tools such as webpack to copy all fonts to the build directory even if you are not using all of them. To reduce the build size, import only the styles you need. For example, if you only need filled and outlined icons, import `filled.css` and `outlined.css` instead of the default `material-icons.css`:

```diff
-import 'material-icons/iconfont/material-icons.css';
+import 'material-icons/iconfont/filled.css';
+import 'material-icons/iconfont/outlined.css';
```

<details>
<summary><strong>Show all</strong></summary><br>

Icons | CSS | Sass
:--- | :--- | :---
Filled | filled.css | filled.scss
Outlined | outlined.css | outlined.scss
Round | round.css | round.scss
Sharp | sharp.css | sharp.scss
Two Tone | two-tone.css | two-tone.scss

</details>

### Using Sass

Import in Sass (example: `src/styles.scss` in Angular CLI):

```scss
@import 'material-icons/iconfont/material-icons.scss';
```

Available Sass variables:

```scss
$material-icons-font-path: './' !default;
$material-icons-font-size: 24px !default;
$material-icons-font-display: block !default;
```

If you are getting errors with webpack or Vue CLI, add this line before importing:

```scss
$material-icons-font-path: '~material-icons/iconfont/';
```

### Using Angular `mat-icon`

To display an icon, use one of the following:

```html
<mat-icon>pie_chart</mat-icon>
<mat-icon fontSet="material-icons-outlined">pie_chart</mat-icon>
<mat-icon fontSet="material-icons-round">pie_chart</mat-icon>
<mat-icon fontSet="material-icons-sharp">pie_chart</mat-icon>
<mat-icon fontSet="material-icons-two-tone">pie_chart</mat-icon>
```

### Using CSS Classes

Alternatively, you may use CSS classes instead of ligatures to display icons. [Learn more](https://github.com/marella/material-icons/tree/main/css#readme)

## Available Icons

See [demo].

## License

Material design icons are created by [Google](https://github.com/google/material-design-icons#license).

> We have made these icons available for you to incorporate into your products under the [Apache License Version 2.0][license]. Feel free to remix and re-share these icons and documentation in your products.
We'd love attribution in your app's *about* screen, but it's not required.

[releases]: https://github.com/marella/material-icons/releases
[license]: https://github.com/marella/material-icons/blob/main/LICENSE
[demo]: https://marella.github.io/material-icons/demo/
