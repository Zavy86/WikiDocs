Priss CSS Print Framework
==========================

Priss is basically just a CSS file to be used as your print stylesheet. It does its
best to make sure web pages will look nice and readable when printed.

It is meant as a starting point to be modified rather than an off the shelf solution.

Usage
------

To use Priss, just include the following bit of code in your markup.

    <link rel="stylesheet" href="print.css" type="text/css" media="print" charset="utf-8">

That `media="print"` section tells the browser to only apply the stylesheet
when the web page is being printed.

Be sure to set all other CSS files to `media="screen"` so that they don't affect
the printing of the web page.

Credits
--------

Priss is a fork of [Hartija](http://code.google.com/p/hartija/).

