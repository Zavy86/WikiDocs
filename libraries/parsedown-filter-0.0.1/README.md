## ParsedownFilter
### An extension for Parsedown ( http://parsedown.org ).
#### Written by Christopher Andrews.

---

This class will allow you do define a callback which can intercept each html tag that is output by Parsedown.
At the moment this class is usable, but still in development. As my website grows, this will too, be sure to check back 
if this class is something you may find useful.

### Instantiation of ParsedownFilter. 
To use ParsedownFilter, you must also install Parsedown. 
This implementation also requires a callback function taking a single argument passed by reference.

```php
require('Parsedown.php');
require('ParsedownFilter.php');

$FilteredParsedown = new ParsedownFilter( 'myFilter' );

function myFilter( &$tag ){
	//Filter away.
}
```

### The callback function.
A knowledge of the inner workings for Parsedown may be required, however I'll update this section soon with 
a basic instruction set for custom markdown tag filtering.

Each element is passed to the callback via the reference parameter. 
It has a few properties which can be modified to suit your application.
It is possible to add nested html elements, and also remove or modify the current element. Some helper functions for 
this will be available soon.

| Property | Description |
| :--- | :--- |
| $tag[ 'name' ] | The name of the tag.
| $tag[ 'text' ] | The text between the opening and closing tags.
| $tag[ 'attributes' ] | An array containing tag properties to be written.

Always either return true, or return nothing. A future update will use the 'false' return value as an indicator 
to remove the html node before outputting the result.

### An example: link filter.

This example will modify any external links 
to be opened in a new tab and have the `nofollow` attribute applied. 
This is handy when you cannot monitor links that people may post on your site.

 
```php

require('Parsedown.php');
require('ParsedownFilter.php');

$obj = new ParsedownFilter( 'myFilter' );
	
function myFilter( &$el ){

	switch( $el[ 'name' ] ){
		case 'a':

			$url = $el[ 'attributes' ][ 'href' ];
			
			/***
				If there is no protocol handler, and the link is not an open protocol address, 
				the links must be relative so we can return as there is nothing to do.
			***/
			
			if( strpos( $url, '://' ) === false )
				if( ( ( $url[ 0 ] == '/' ) && ( $url[ 1 ] != '/' ) ) || ( $url[ 0 ] != '/' ) ){ return; }
					
		
			if( strpos( $url, $_SERVER["SERVER_NAME"] ) === false ){
				$el[ 'attributes' ][ 'rel' ] = 'nofollow';
				$el[ 'attributes' ][ 'target' ] = '_blank';
			}
			break;
			
	}
}
```