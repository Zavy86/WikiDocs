# Wiki|Docs
Just a databaseless markdown flat-file wiki engine.

Or maybe the best you've ever tried! 😜

*Please consider supporting this project by making a donation via [PayPal](https://www.paypal.me/zavy86)*

## Features
- Open source
- Plain text files
- No database required
- Markdown syntax
- Editor full WYSIWYG
- Unlimited page revisions
- Uploading images
- Content can be categorized in namespaces
- Automatic generated index and sitemap
- Public and private browsing
- and many more..

## Setup
- [Download](https://github.com/Zavy86/wikidocs/releases) the lastest release
- Clone the repo `git clone https://github.com/Zavy86/wikidocs.git`

## Configuration
- Copy the configuration sample file `cp config.sample.inc.php config.inc.php`
- Edit the configuration file `nano config.inc.php`
- Create the `.htaccess` file like:
```
<IfModule mod_rewrite.c>
	RewriteEngine On
	RewriteBase /wikidocs/
	RewriteCond %{REQUEST_FILENAME} !-f
	RewriteRule ^(.*)$ index.php?doc=$1 [NC,L,QSA]
</IfModule>
```
- Make sure that RewriteBase is the same as the PATH in the configuration file

## Developers
**Manuel Zavatta**
- [GitHub](https://github.com/Zavy86)
- [WebSite](http://www.zavynet.org)
- [Contacts](mailto://manuel.zavatta@gmail.com)

## License
Code released under the MIT License.
