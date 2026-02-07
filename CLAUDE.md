# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Docmost is an open-source collaborative wiki and documentation software. It's a monorepo using pnpm workspaces and Nx for building.

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development (both frontend and backend)
pnpm dev

# Run individual services
pnpm client:dev    # Frontend on port 5173
pnpm server:dev    # Backend on port 3000

# Build
pnpm build         # Build all
pnpm client:build  # Build frontend only
pnpm server:build  # Build server only

# Run production
pnpm start         # Start server in production mode

# Database migrations (from apps/server directory)
pnpm migration:create <name>  # Create new migration
pnpm migration:up             # Run next migration
pnpm migration:latest         # Run all pending migrations
pnpm migration:down           # Rollback last migration
pnpm migration:codegen        # Generate TypeScript types from database

# Testing (from apps/server directory)
pnpm test              # Run unit tests
pnpm test:watch        # Run tests in watch mode
pnpm test:e2e          # Run e2e tests

# Linting
pnpm --filter server lint
pnpm --filter client lint

# Email templates preview
pnpm email:dev         # Preview email templates on port 5019
```

## Architecture

### Monorepo Structure

- **apps/server**: NestJS backend (Fastify adapter)
- **apps/client**: React frontend (Vite, Mantine UI)
- **packages/editor-ext**: Shared TipTap editor extensions

### Backend (apps/server)

- **Framework**: NestJS with Fastify
- **Database**: PostgreSQL with Kysely query builder
- **Cache/Queue**: Redis with BullMQ
- **Auth**: JWT with Passport (supports SAML, OIDC, Google OAuth, LDAP)

Key directories:

- `src/core/` - Business modules (auth, user, page, space, group, comment, search, share, attachment, workspace, casl)
- `src/database/` - Kysely setup, migrations, repos, type definitions
- `src/collaboration/` - Hocuspocus Y.js collaboration server for real-time editing
- `src/integrations/` - External services (mail, storage, export, import, queue, telemetry)
- `src/ws/` - WebSocket gateway
- `src/ee/` - Enterprise edition features (licensed separately)

Path aliases (tsconfig):

- `@docmost/db/*` → `./src/database/*`
- `@docmost/transactional/*` → `./src/integrations/transactional/*`
- `@docmost/ee/*` → `./src/ee/*`

### Frontend (apps/client)

- **Framework**: React 18 with Vite
- **UI**: Mantine v8
- **State**: Jotai (atoms), React Query (server state)
- **Editor**: TipTap with custom extensions
- **Routing**: React Router v7
- **i18n**: i18next

Key directories:

- `src/features/` - Feature modules (editor, page, space, auth, user, comment, search, share, websocket)
- `src/components/` - Shared UI components
- `src/pages/` - Route page components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities and API clients
- `src/ee/` - Enterprise edition features

Path alias: `@/*` → `./src/*`

### Editor Extensions (packages/editor-ext)

Shared TipTap extensions used by both client and server for rendering:

- Callout, table, math (KaTeX), code blocks, diagrams (Draw.io, Excalidraw, Mermaid)
- Mentions, attachments, embeds, comments, subpages

### Real-time Collaboration

- Uses Hocuspocus (Y.js) for real-time document collaboration
- Separate collaboration server can run via `pnpm collab:dev`
- Socket.io for presence and notifications

### Enterprise Features

Enterprise code is in `apps/server/src/ee`, `apps/client/src/ee`, and `packages/ee`. These are loaded dynamically and licensed separately under `packages/ee/License`.

## Environment Setup

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `APP_URL` - Application URL (e.g., <http://localhost:3000>)
- `APP_SECRET` - 32+ character secret (generate with `openssl rand -hex 32`)
- `STORAGE_DRIVER` - `local` or `s3`
- `MAIL_DRIVER` - `smtp` or `postmark`

## Docker

```bash
# Development with docker-compose
docker-compose up

# Requires PostgreSQL and Redis services
```

The app exposes port 3000 internally, mapped to 3030 in docker-compose.
