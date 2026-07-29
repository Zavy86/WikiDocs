#
# Wiki|Docs Makefile
#

VERSION := $(strip $(shell cat VERSION 2>/dev/null))
#BEV = $(shell jq -r .version backend/package.json)
#FEV = $(shell jq -r .version frontend/package.json)
#DV = $(shell jq -r .version desktop/package.json)
# @todo check if all versions is equals

.PHONY: install-deps build-runtime desktop-release docker-compose-up docker-compose-down docker-release docker-release-beta

install-deps:
	cd backend && npm i
	cd frontend && npm i
	cd desktop && npm i

build-runtime:
	cd backend && npm run build
	cd frontend && npm run build

desktop-release:
	@echo "Release Wiki|Docs Desktop version $(VERSION)"
	cd desktop && npm run make

docker-compose-up:
	@echo "Starting Wiki|Docs stack"
	docker compose -f docker/compose.yml -p wikidocs-dev up --build --remove-orphans -d

docker-compose-down:
	@echo "Stopping Wiki|Docs stack"
	docker compose -f docker/compose.yml -p wikidocs-dev down
	docker compose -f docker/compose.yml -p wikidocs-dev rm -f

docker-release:
	@echo "Releasing Wiki|Docs version $(VERSION)"
	#docker build -f docker/dockerfile -t zavy86/wikidocs:$(VERSION) .
	docker buildx build --platform linux/amd64,linux/arm64 -f docker/dockerfile -t zavy86/wikidocs:$(VERSION) .

docker-release-beta:
	@echo "Releasing Wiki|Docs beta version"
	docker buildx build --platform linux/amd64,linux/arm64 -f docker/dockerfile -t zavy86/wikidocs:beta --push .
