# Contributing to Wiki|Docs

Contributions of all sizes are welcome: bug reports, feature proposals, documentation improvements, tests, code changes,
and PR reviews.

Please follow common open-source practices:

- Use clear commit messages.
- Keep changes focused and atomic.
- Update documentation when behavior changes.
- Be respectful and collaborative in discussions and reviews.


## Repository layout

```text
.
├── shared/       # Shared cross-layer contracts
├── backend/      # NestJS API
├── frontend/     # Angular web client
├── desktop/      # Electron desktop app
├── docker/       # Container image and compose stack
├── datasets/     # Local sample dataset
└── dev.env       # Local development environment
```

For the complete architecture, detailed API contracts, and sequence diagrams, refer to [`ARCHITECTURE.md`](./ARCHITECTURE.md).


## Prerequisites

- GNU Make (`make` command)
- Node.js and npm (project uses npm workspaces/scripts per package)


## Install dependencies

From repository root:

```bash
make install-deps
```

This runs `npm ci` in `backend`, `frontend`, and `desktop`.


## Serve commands

These are shell equivalents of the WebStorm run configurations.

```bash
# Terminal 1 - Backend
cd backend && npm run start

# Terminal 2 - Frontend
cd frontend && npm run start

# Terminal 3 - Desktop (optional)
cd desktop && npm run start
```

Recommended development workflow: run backend + frontend together; start desktop only when working on Electron-specific behavior.


### Accessing the app

For the `backend` open your browser to [http://localhost:3000/api/](http://localhost:3000/api/).

For the `frontend` to [http://localhost:4200/](http://localhost:4200/).

For the `desktop` application, the Electron window will open automatically when you run the serve command.


## Testing the Docker environment

The project includes a Docker image and compose stack for local development and testing. 
The image is built from the `docker/dockerfile` and the compose stack is defined in `docker/compose.yml`.

The docker image includes the backend and frontend, based on the `node:alpine` base image it runs the backend and the
frontend is served as static files.

The compose stack includes the image and a volume for the datasets, exposing the app on port 3000.

From repository root:

```bash
# Start stack in background
make docker-compose-up

# Smoke checks
docker compose -f docker/compose.yml -p wikidocs ps
docker compose -f docker/compose.yml -p wikidocs logs --tail=100 wikidocs
curl http://localhost:3000/api/information

# Stop stack
make docker-compose-down
```

The compose stack exposes the app on `http://localhost:3000` and includes a container health check for the frontend `/`
and for the backend `/api/health`.


## Contribution workflow (mandatory)

Every published change must follow this flow:

1. Open or join a GitHub Issue and discuss the change first.
2. Implement the change in a dedicated branch.
3. Open a Pull Request linked to the Issue.
4. Merge only after review approval and required checks are green.

Direct code changes without prior Issue discussion are not accepted.


## Required validation before opening/merging a PR

Build and test checks must pass across all three project environments (backend, frontend, desktop).

```bash
# Backend
cd backend && npm run test && npm run build

# Frontend
cd frontend && npm run test && npm run build

# Desktop
cd desktop && npm run test && npm run make
```

If your change touches runtime behavior, also run the application with the serve commands and validate the affected flow.
