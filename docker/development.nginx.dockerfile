#
# Wiki|Docs Development Build with Nginx
#
# Build command:
# docker build --no-cache -f docker/development.nginx.dockerfile -t wikidocs-nginx-dev .
#
# Run command:
# docker run --name wikidocs-nginx-dev -d -p 80:80 -v ${PWD}:/var/www/html wikidocs-nginx-dev
#

FROM alpine:3.20

ARG DEPENDENCIES="\
    nano \
    vim \
    curl \
    shadow \
    nginx \
    php83 \
    php83-fpm \
    php83-dom \
    php83-json \
    php83-mbstring \
    php83-session \
    php83-xml \
"

# Update package index and install dependencies
RUN apk update && apk add --no-cache $DEPENDENCIES

# Remove default Nginx configuration
RUN rm /etc/nginx/nginx.conf

# Copy custom Nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf

# Remove default index.html
RUN rm -rf /var/lib/nginx/html/*

# Create necessary directories and set permissions
RUN mkdir -p /var/www/html \
    && mkdir -p /var/run/php-fpm83 \
    && chown -R nginx:nginx /var/www/html \
    && chown -R nginx:nginx /var/run/php-fpm83 \
    && chmod 755 /var/run/php-fpm83

# Configure PHP-FPM to run as nginx user
RUN sed -i 's/^user = .*/user = nginx/' /etc/php83/php-fpm.d/www.conf \
 && sed -i 's/^group = .*/group = nginx/' /etc/php83/php-fpm.d/www.conf \
 && sed -i 's|^listen =.*|listen = /var/run/php-fpm83/php-fpm.sock|' /etc/php83/php-fpm.d/www.conf \
 && sed -i 's/^;listen\.owner = .*/listen.owner = nginx/' /etc/php83/php-fpm.d/www.conf \
 && sed -i 's/^;listen\.group = .*/listen.group = nginx/' /etc/php83/php-fpm.d/www.conf \
 && sed -i 's/^;listen\.mode = .*/listen.mode = 0660/' /etc/php83/php-fpm.d/www.conf

# Start script to override nginx user's uid/gid and start services
RUN echo -e \
'#!/bin/sh\n'\
'groupmod -o -g ${PGID:-1000} nginx\n'\
'usermod -o -u ${PUID:-1000} nginx\n'\
'chown -R nginx:nginx /var/www/html\n'\
'chown -R nginx:nginx /var/run/php-fpm83\n'\
'php-fpm83 --nodaemonize &\n'\
'exec nginx -g "daemon off;"' > /start.sh

RUN chmod +x /start.sh

WORKDIR /var/www/html

ENTRYPOINT ["/start.sh"]

EXPOSE 80
