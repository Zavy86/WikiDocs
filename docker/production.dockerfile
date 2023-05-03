#
# Wiki|Docs Production Build
#
# Build command:
# docker build --no-cache -t zavy86/wikidocs .
#
# Build multi-architecture
# docker buildx create --name builder --driver docker-container --use
# docker buildx inspect --bootstrap
# docker buildx build --platform linux/amd64,linux/arm64 --no-cache --push -t zavy86/wikidocs .
#

FROM alpine:3.15

ARG DEPENDENCIES="\
apache2 \
php7 \
php7-apache2 \
php7-json \
php7-mbstring \
php7-session \
shadow \
"

# installation
RUN apk add --no-cache $DEPENDENCIES

# enable rewrite module and allow .htaccess overrides
RUN sed -i "s/#LoadModule\ rewrite_module/LoadModule\ rewrite_module/" /etc/apache2/httpd.conf && \
    printf "\n<Directory \"/var/www/localhost/htdocs\">\n\tAllowOverride All\n</Directory>\n" >> /etc/apache2/httpd.conf && \
    rm -f /var/www/localhost/htdocs/index.html

# download and extract wikidocs archive
RUN curl -Lso wikidocs.tar.gz https://github.com/Zavy86/WikiDocs/archive/master.tar.gz && \
    tar --strip-components=1 -xf wikidocs.tar.gz -C /var/www/localhost/htdocs/ && \
    rm wikidocs.tar.gz && \
    cd /var/www/localhost/htdocs && \
    sed -i "s/config\.inc\.php/config\/config.inc.php/" setup.php update.php functions.inc.php && \
    mkdir config && \
    ln -s /var/www/localhost/htdocs/config / && \
    ln -s /var/www/localhost/htdocs/documents /

# pre-populate the .htaccess file so if we supply a config.inc.php, everything still works
RUN echo -e \
'<IfModule mod_rewrite.c>\n'\
'RewriteEngine On\n'\
'RewriteBase /\n'\
'RewriteCond %{REQUEST_FILENAME} !-f\n'\
'RewriteRule ^(.*)$ index.php?doc=$1 [NC,L,QSA]\n'\
'</IfModule>' >/var/www/localhost/htdocs/.htaccess

# start script to override apache user's uid/gid
RUN echo -e \
'#!/bin/sh\n'\
'groupmod -o -g ${PGID:-1000} apache\n'\
'usermod -o -u ${PUID:-1000} apache\n'\
'chown -R apache:apache /var/www/localhost/htdocs\n'\
'exec httpd -D FOREGROUND' > /start.sh
RUN chmod +x /start.sh

WORKDIR /var/www/localhost/htdocs
EXPOSE 80
VOLUME /documents
VOLUME /config

ENTRYPOINT ["/start.sh"]
