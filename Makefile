# Wiki|Docs Makefile

# Build Development environment
dev-build:
	docker build --no-cache -f docker/development.dockerfile -t wikidocs-dev .

# Run Development environment
dev-run:
	docker run --name wikidocs-dev -d -p 80:80 -v ${PWD}:/var/www/localhost/htdocs wikidocs-dev

# Build multi-architecture and Push to Docker Hub
hub-prepare:
	docker buildx create --name builder --driver docker-container --use && \
	docker buildx inspect --bootstrap
hub:
	docker buildx build -f docker/production.dockerfile --platform linux/amd64,linux/arm64 --no-cache --push -t zavy86/wikidocs .
