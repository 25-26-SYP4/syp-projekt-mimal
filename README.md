# SYP - Fußballturnier

This repository contains a small tournament management app (frontend + Node.js backend).

Quick start (development):

1. Backend

```bash
cd backend
npm install
npm start
```

2. Open the frontend

Open `code/fußballturnier/index.html` directly in the browser or navigate to the server URL (e.g. http://localhost:3000)

Deployment notes for school server

- The backend serves the frontend automatically if the `code/fußballturnier` folder exists next to `backend/` (recommended layout).
- Environment variables (see `backend/.env.example`) can be used to configure the server URL and secrets.
- Keep regular backups of `backend/database/*.json` (see `backend/backup/`).

Recommended simple deployment (Linux server):

```bash
# on the server (run as simple user or service account)
git clone <repo-url> /var/www/turnier
cd /var/www/turnier/backend
npm install
# create a basic .env (see .env.example)
npm start
```

For a production setup, use a process manager (pm2) or a systemd service (examples in `backend/deploy/`).

Maintainers: Document any server admin instructions in this README and keep a copy of `.env.example` updated.

## Development

Run the backend in development mode (hot reload):

```bash
cd backend
npm install
npm run dev
```

Open the frontend in a browser during local development:

- Option A: Start `backend` then open `http://localhost:3000` (recommended).
- Option B: Use the editor extension "Open with Live Server" on `code/fußballturnier/index.html` (works but some API calls require CORS when served from file://).

Dev notes:

- A dev-only reset endpoint is available at `POST /api/dev/reset` (only when `NODE_ENV !== 'production'`). Use it to restore demo users and sample state during sprint reviews.
- To enable CORS restrictions in production, set `ALLOWED_ORIGINS` to a comma-separated list of allowed origins in `.env`.
