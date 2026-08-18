#
# Wiki|Docs Makefile
#

VERSION := $(strip $(shell jq -Rr . VERSION))
VERSION_MAJOR := $(strip $(shell jq -Rr 'split(".")[0]' VERSION))
VERSION_MINOR := $(strip $(shell jq -Rr 'split(".")[0:2] | join(".")' VERSION))
VERSION_BACKEND := $(strip $(shell jq -r .version backend/package.json))
VERSION_FRONTEND := $(strip $(shell jq -r .version frontend/package.json))
VERSION_DESKTOP := $(strip $(shell jq -r .version desktop/package.json))

.PHONY: checks check-versions check-localizations install-deps execute-tests build-runtime desktop-release docker-build-dev docker-compose-up docker-compose-down docker-release docker-release-beta docker-release-pulse

check-versions:
	@if ! jq -en \
		--arg version "$(VERSION)" \
		--arg backend "$(VERSION_BACKEND)" \
		--arg frontend "$(VERSION_FRONTEND)" \
		--arg desktop "$(VERSION_DESKTOP)" \
		'$$version == $$backend and $$version == $$frontend and $$version == $$desktop' > /dev/null; then \
		echo "Version mismatch: VERSION=$(VERSION), backend=$(VERSION_BACKEND), frontend=$(VERSION_FRONTEND), desktop=$(VERSION_DESKTOP)" >&2; \
		exit 1; \
	else \
  	echo "Versions OK: $(VERSION)"; \
	fi

check-localizations:
	cd frontend && npm run check:localizations

install-deps:
	cd backend && npm ci
	cd frontend && npm ci
	cd desktop && npm ci

execute-tests:
	cd backend && npm run test
	cd frontend && npm run test
	cd desktop && npm run test

build-runtime:
	cd backend && npm run build
	cd frontend && npm run build

desktop-release:
	@echo "Release Wiki|Docs Desktop version $(VERSION)"
	cd desktop && npm run make

docker-build-dev:
	@echo "Releasing Wiki|Docs development version"
	docker build -f docker/dockerfile -t zavy86/wikidocs:dev .

docker-compose-up:
	@echo "Starting Wiki|Docs stack"
	docker compose -f docker/compose.yml -p wikidocs-dev up --build --remove-orphans -d

docker-compose-down:
	@echo "Stopping Wiki|Docs stack"
	docker compose -f docker/compose.yml -p wikidocs-dev down
	docker compose -f docker/compose.yml -p wikidocs-dev rm -f

docker-release:
	@echo "Releasing Wiki|Docs version $(VERSION)"
	docker buildx build --platform linux/amd64,linux/arm64 -f docker/dockerfile \
		-t zavy86/wikidocs:$(VERSION) \
		-t zavy86/wikidocs:$(VERSION_MINOR) \
		-t zavy86/wikidocs:$(VERSION_MAJOR) \
		--push .

docker-release-beta:
	@echo "Releasing Wiki|Docs beta version"
	docker buildx build --platform linux/amd64,linux/arm64 -f docker/dockerfile -t zavy86/wikidocs:beta --push .

docker-release-pulse:
	@echo "Releasing Wiki|Docs Pulse"
	docker buildx build --platform linux/amd64,linux/arm64 -f pulse/dockerfile -t zavy86/wikidocs:pulse --push .
