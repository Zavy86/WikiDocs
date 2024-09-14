# Wiki|Docs Makefile


# Build Development environment
dev-build:
	docker build --no-cache -f docker/development.dockerfile -t wikidocs-dev .

# Run Development environment
dev-run:
	docker run --name wikidocs-dev -d -p 81:80 -v ${PWD}:/var/www/localhost/htdocs wikidocs-dev

# Build NginX Development environment
dev-nginx-build:
	docker build --no-cache -f docker/development.nginx.dockerfile -t wikidocs-nginx-dev .

# Run NginX Development environment
dev-nginx-run:
	docker run --name wikidocs-nginx-dev -d -p 82:80 -v ${PWD}:/var/www/html wikidocs-nginx-dev

# Build Production environment
prd-build:
	docker build --no-cache -f docker/production.dockerfile -t wikidocs-prd .

# Run Production environment for local tests
prd-run:
	docker run --name wikidocs-prd -d -p 88:80 -v ${PWD}:/var/www/localhost/htdocs wikidocs-prd

# Prepare multi-architecture build for Docker Hub
hub-prepare:
	docker buildx create --name builder --driver docker-container --use
	docker buildx inspect --bootstrap

# Build multi-architecture and Push to Docker Hub
hub:
	docker buildx build -f docker/production.dockerfile --platform linux/amd64,linux/arm64 --no-cache --push -t zavy86/wikidocs .
