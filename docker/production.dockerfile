#
# Wiki|Docs Production Build
#
# Build:
# docker build --no-cache -f docker/production.dockerfile -t zavy86/wikidocs .
#
# Run:
# docker run --name wikidocs -d -p 80:80 -v /path/to/local/wikidocs/datasets/or/volume:/datasets zavy86/wikidocs
#
# Build multi-architecture and push
# docker buildx create --name builder --driver docker-container --use
# docker buildx inspect --bootstrap
# docker buildx build -f docker/production.dockerfile --platform linux/amd64,linux/arm64 --no-cache --push -t zavy86/wikidocs .
#

FROM alpine:3.20

ARG DEPENDENCIES="\
shadow \
apache2 \
php \
php-apache2 \
php-dom \
php-json \
php-mbstring \
php-session \
php-xml \
"

# installation
RUN apk add --no-cache $DEPENDENCIES

# configure apache
RUN sed -ri \
    -e 's!^#(LoadModule rewrite_module .*)$!\1!g' \
    -e 's!^#(LoadModule deflate_module .*)$!\1!g' \
    -e 's!^#(LoadModule http2_module .*)$!\1!g' \
    -e 's!^(\s*AllowOverride) None.*$!\1 All!g' \
    "/etc/apache2/httpd.conf"
RUN echo "ServerName localhost" >> /etc/apache2/httpd.conf
RUN rm /var/www/localhost/htdocs/index.html

# copy application files
COPY . /var/www/localhost/htdocs/

# make a link for datasets volume
RUN ln -s /var/www/localhost/htdocs/datasets /

# copy htaccess files from samples
COPY ./sample.htaccess /var/www/localhost/htdocs/.htaccess

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

VOLUME /datasets

EXPOSE 80

