#
# Wiki|Docs Development Build
#
# Build command:
# docker build --no-cache -f development.dockerfile -t wikidocs-dev .
#
# Run command:
# docker run --name wikidocs-dev -d -p 80:80 -v ${PWD}:/var/www/localhost/htdocs wikidocs-dev
#

FROM alpine:3.15

ARG DEPENDENCIES="\
nano \
curl \
shadow \
apache2 \
php7 \
php7-apache2 \
php7-json \
php7-mbstring \
php7-session \
"

# installation
RUN apk add --no-cache $DEPENDENCIES

# configure httpd
RUN sed -ri \
#    -e 's!^DocumentRoot "/var/www/localhost/htdocs"$!DocumentRoot "/var/www/localhost/htdocs/public"!g' \
#    -e 's!^<Directory "/var/www/localhost/htdocs">$!<Directory "/var/www/localhost/htdocs/public">!g' \
    -e 's!^#(LoadModule rewrite_module .*)$!\1!g' \
    -e 's!^(\s*AllowOverride) None.*$!\1 All!g' \
    "/etc/apache2/httpd.conf"
RUN echo "ServerName localhost" >> /etc/apache2/httpd.conf

# start script to override apache user's uid/gid
RUN echo -e \
'#!/bin/sh\n'\
'groupmod -o -g ${PGID:-1000} apache\n'\
'usermod -o -u ${PUID:-1000} apache\n'\
'chown -R apache:apache /var/www/localhost/htdocs\n'\
'exec httpd -D FOREGROUND' > /start.sh
RUN chmod +x /start.sh

WORKDIR /var/www/localhost/htdocs

ENTRYPOINT ["/start.sh"]

EXPOSE 80
