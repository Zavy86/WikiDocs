#
# Wiki|Docs Makefile
#

VERSION := $(strip $(shell jq -Rr . VERSION))
BEV := $(strip $(shell jq -r .version backend/package.json))
FEV := $(strip $(shell jq -r .version frontend/package.json))
DV := $(strip $(shell jq -r .version desktop/package.json))

.PHONY: checks check-versions check-localizations install-deps build-runtime desktop-release docker-compose-up docker-compose-down docker-release docker-release-beta

checks: check-versions check-localizations

check-versions:
	@if ! jq -en \
		--arg version "$(VERSION)" \
		--arg backend "$(BEV)" \
		--arg frontend "$(FEV)" \
		--arg desktop "$(DV)" \
		'$$version == $$backend and $$version == $$frontend and $$version == $$desktop' > /dev/null; then \
		echo "Version mismatch: VERSION=$(VERSION), backend=$(BEV), frontend=$(FEV), desktop=$(DV)" >&2; \
		exit 1; \
	else \
  	echo "Versions OK: VERSION=$(VERSION)"; \
	fi

check-localizations:
	cd frontend && npm run check:localizations

install-deps:
	cd backend && npm i
	cd frontend && npm i
	cd desktop && npm i

build-runtime:
	cd backend && npm run build
	cd frontend && npm run build

desktop-release: check-versions
	@echo "Release Wiki|Docs Desktop version $(VERSION)"
	cd desktop && npm run make

docker-compose-up:
	@echo "Starting Wiki|Docs stack"
	docker compose -f docker/compose.yml -p wikidocs-dev up --build --remove-orphans -d

docker-compose-down:
	@echo "Stopping Wiki|Docs stack"
	docker compose -f docker/compose.yml -p wikidocs-dev down
	docker compose -f docker/compose.yml -p wikidocs-dev rm -f

docker-release: check-versions
	@echo "Releasing Wiki|Docs version $(VERSION)"
	#docker build -f docker/dockerfile -t zavy86/wikidocs:$(VERSION) .
	docker buildx build --platform linux/amd64,linux/arm64 -f docker/dockerfile -t zavy86/wikidocs:$(VERSION) .

docker-release-beta: check-versions
	@echo "Releasing Wiki|Docs beta version"
	docker buildx build --platform linux/amd64,linux/arm64 -f docker/dockerfile -t zavy86/wikidocs:beta --push .

docker-release-pulse:
	@echo "Releasing Wiki|Docs Pulse"
	docker buildx build --platform linux/amd64,linux/arm64 -f pulse/dockerfile -t zavy86/wikidocs:pulse --push .
