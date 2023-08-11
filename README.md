# Wiki|Docs

Just a databaseless markdown flat-file wiki engine.

Project homepage: [https://www.wikidocs.it](https://www.wikidocs.it)

_Please consider supporting this project by making a donation via [PayPal](https://www.paypal.me/zavy86)_

[![Wiki|Docs presentation and contributors recruitment on YouTube](https://wikidocs.it/datasets/documents/homepage/cover-side-project-wikidocs-youtube.jpg)](https://www.youtube.com/watch?v=NFILGeozt7k "Watch Wiki|Docs presentation and contributors recruitment on YouTube")

## Features
- Open source
- Plain text files
- No database required
- Markdown syntax
- Editor full WYSIWYG
- Support for math KaTeX
- Unlimited page revisions
- Uploading and downloading Attachments
- Uploading images (also from clipboard)
- Content can be categorized in namespaces
- Automatic generated index and sitemap
- Public and private browsing
- Syntax highlighting
- Multi language
- Dark mode
- Sitemap
- and many more...

## Demo
Try the demo playground at: [http://demo.wikidocs.it](http://demo.wikidocs.it)

Authentication code is: `demo`

## Setup

### Manual
[Download](https://github.com/Zavy86/wikidocs/releases) the lastest release or clone the repository with `git clone https://github.com/Zavy86/wikidocs.git`

### Docker
There is a [Docker image](https://hub.docker.com/repository/docker/zavy86/wikidocs) that sets up Wiki|Docs with Apache2 and PHP automatically.

#### Quick run
```
docker run -d -p 80:80 zavy86/wikidocs
```

#### Additional settings
```
docker run --name wikidocs -d -p 80:80 -v /path/to/local/wikidocs/datasets/or/volume:/datasets -e PUID=1000 -e PGID=1000 zavy86/wikidocs
```

#### With Docker Compose
```
version: '3'

services:
  wikidocs:
    image: zavy86/wikidocs
    environment:
      - PUID=1000
      - PGID=1000
    ports:
      - 80:80
    volumes:
      - /path/to/local/wikidocs/datasets/or/volume:/datasets
```

## Apache Configuration

### Automatic
- The `setup.php` script will automatically create both `datasets/config.inc.php` and `.htacess` files

### Manual
- Copy the configuration sample file `cp datasets/config.sample.inc.php datasets/config.inc.php`
- Edit the configuration file `nano datasets/config.inc.php`
- Create the `.htaccess` file like this:
```
<IfModule mod_rewrite.c>
	RewriteEngine On
	RewriteBase /
	RewriteCond %{REQUEST_FILENAME} !-f
	RewriteRule ^(.*)$ index.php?doc=$1 [NC,L,QSA]
</IfModule>
```
- Make sure that RewriteBase is the same as the PATH in the configuration file included trailing slashes

## Nginx Configuration

### Manual
- Use this as Nginx configuration for WikiDocs:
  ```
  ...
          location /wikidocs/ {
                  if (!-e $request_filename){
                  rewrite ^/(.*)$ /index.php?doc=$1 last;
                  }
                  try_files $uri $uri/ =404;
          }
  ```
- Copy the configuration sample file `cp datasets/config.sample.inc.php datasets/config.inc.php`
- Edit the configuration file `nano datasets/config.inc.php`

## Customization

You can customize the default template by creating the file `styles/styles-custom.css`.



## Developers

### Creator
**Manuel Zavatta**
- [WebSite](http://www.zavy.im)
- [GitHub](https://github.com/Zavy86)
- [YouTube](https://www.youtube.com/@zavy86)
- [Contacts](mailto://manuel.zavatta@gmail.com)

### Contributors
- [Amin Persia](https://github.com/leomoon)
- [Alex Meyer](https://github.com/reyemxela)
- [Micha](https://github.com/serial)
- [Bo Allen](https://github.com/bitwisecreative)
- [Jv3ga](https://github.com/jv3ga)
- [Sam](https://github.com/sam-6174)
- [kevwkev](https://github.com/kevwkev)
- [Сергей Ворон](https://github.com/vorons)
- [Nicolas Prenveille](https://github.com/nicolas35380)

## License
Code released under the MIT License
