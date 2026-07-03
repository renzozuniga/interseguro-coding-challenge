# node-api

Express.js service that receives Q and R matrices from the Go API and returns statistical metrics for each. This is an **internal service** — it is not meant to be called directly by the frontend.

## Endpoints

| Method | Path                    | Auth | Description                                 |
|--------|-------------------------|------|---------------------------------------------|
| POST   | /api/v1/matrix-stats    | JWT  | Compute stats for Q and R matrices          |
| GET    | /health                 | No   | Health check                                |

### POST /api/v1/matrix-stats

Called by the Go API with a service-to-service JWT.

```json
// Request
{
  "q": [[-0.169, -0.897, 0.408], [-0.507, -0.276, -0.816], [-0.845, 0.345, 0.408]],
  "r": [[-5.916, -7.437], [0, -0.828], [0, 0]]
}

// Response 200
{
  "q": { "max": 0.408, "min": -0.897, "average": -0.037, "sum": -0.333, "isDiagonal": false },
  "r": { "max": 0,     "min": -7.437, "average": -2.362, "sum": -14.18, "isDiagonal": false }
}
```

**isDiagonal** is `true` only when the matrix is square AND every off-diagonal entry is within 1e-10 of zero. Floating-point entries very close to zero (produced by the Householder algorithm) are tolerated.

## Project layout

```
server.js                    — process entry point, env validation, app.listen
src/
  app.js                     — Express app setup, middleware registration
  routes/
    health.js
    stats.js                 — mounts jwtMiddleware + statsController
  controllers/
    statsController.js       — parses body, calls service, returns JSON
  services/
    statsService.js          — pure stat functions (no HTTP, no Express)
  middlewares/
    auth.js                  — JWT validation middleware
    errorHandler.js          — centralized error handler
  validators/
    matrixValidator.js       — manual input validation (returns error string or null)
```

## Run locally (without Docker)

```bash
cd node-api

npm install

cp .env.example .env
# edit .env and set JWT_SECRET (must match go-api's secret)

npm start
```

## Environment variables

| Variable   | Required | Default | Description                              |
|------------|----------|---------|------------------------------------------|
| JWT_SECRET | Yes      | —       | HMAC-SHA256 key shared with the Go API   |
| PORT       | No       | 3000    | Port the server listens on               |
