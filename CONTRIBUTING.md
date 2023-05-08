# Contributing

Build the development environment with Docker

`docker build --no-cache -f docker/development.dockerfile -t wikidocs-dev .`

`docker run --name wikidocs-dev -d -p 80:80 -v ${PWD}:/var/www/localhost/htdocs wikidocs-dev`

Follow setup instructions and update your settings.

Please use pull requests.

Thank you!
