# frontend

React + Vite SPA served in production by nginx. Provides a UI to:
1. Authenticate with the Go API and receive a JWT.
2. Enter a matrix (textarea, space-separated rows).
3. Display the Q and R matrices from QR decomposition.
4. Display the statistics computed by the Node.js API.

## Run locally (without Docker)

```bash
cd frontend

npm install

# Start Vite dev server (proxies /api to localhost:8080 — go-api must be running)
npm run dev
```

Open http://localhost:5173.

Default credentials (match your go-api .env):
- Username: `admin`
- Password: `changeme`

## Build for production

```bash
npm run build   # outputs to ./dist
```

## Project layout

```
src/
  App.jsx                    — root component, state management
  index.css                  — design tokens and global styles
  api/
    client.js                — fetch wrapper with JWT injection and error normalisation
  components/
    LoginForm.jsx            — credential form, calls /api/v1/auth/login
    MatrixInput.jsx          — textarea + parser for space-separated matrix input
    MatrixDisplay.jsx        — renders a 2-D matrix as a styled table
    StatsDisplay.jsx         — renders the per-matrix statistics panel
nginx.conf                   — SPA fallback + /api proxy to go-api container
```

## Environment variables (dev only)

| Variable         | Description                              |
|------------------|------------------------------------------|
| VITE_API_BASE_URL| Base URL for the Go API (dev proxy target)|

In production (Docker), nginx handles the proxy — no env var is read.
