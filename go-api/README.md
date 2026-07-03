# go-api

Go (Fiber) service that performs QR decomposition via Householder reflections, then calls the Node.js stats API internally and returns a combined response.

## Endpoints

| Method | Path                    | Auth | Description                              |
|--------|-------------------------|------|------------------------------------------|
| POST   | /api/v1/auth/login      | No   | Issue a JWT (24h TTL)                    |
| POST   | /api/v1/qr-decompose    | JWT  | QR factorization + stats (combined)      |
| GET    | /health                 | No   | Health check                             |

### POST /api/v1/auth/login

```json
// Request
{ "username": "admin", "password": "changeme" }

// Response 200
{ "token": "eyJ..." }
```

### POST /api/v1/qr-decompose

```json
// Request — rectangular matrix with m >= n
{ "matrix": [[1, 2], [3, 4], [5, 6]] }

// Response 200
{
  "q": [[-0.169, -0.897, 0.408], [-0.507, -0.276, -0.816], [-0.845, 0.345, 0.408]],
  "r": [[-5.916, -7.437], [0, -0.828], [0, 0]],
  "stats": {
    "q": { "max": 0.408, "min": -0.897, "average": -0.037, "sum": -0.333, "isDiagonal": false },
    "r": { "max": 0,     "min": -7.437, "average": -2.362, "sum": -14.18, "isDiagonal": false }
  }
}
```

## Project layout

```
cmd/api/main.go              — Fiber app setup, route registration, startup config
internal/
  handler/                   — HTTP handlers (thin layer: parse → delegate → respond)
    auth_handler.go
    health_handler.go
    qr_handler.go
  service/
    qr.go                    — Householder QR decomposition (pure functions, no HTTP)
  client/
    node_client.go           — HTTP client for calling node-api
  model/
    request.go               — Input structs
    response.go              — Output structs
  middleware/
    jwt.go                   — JWT validation + token generation
    error.go                 — Centralized Fiber error handler
```

## Run locally (without Docker)

```bash
cd go-api

# Install dependencies
go mod tidy

# Create .env from the example and fill in values
cp .env.example .env

# Run (requires node-api to be running separately)
go run ./cmd/api
```

## Environment variables

| Variable       | Required | Default | Description                          |
|----------------|----------|---------|--------------------------------------|
| JWT_SECRET     | Yes      | —       | HMAC-SHA256 signing key for JWTs     |
| NODE_API_URL   | Yes      | —       | Base URL of the Node.js stats API    |
| ADMIN_USERNAME | Yes      | —       | Username accepted by /auth/login     |
| ADMIN_PASSWORD | Yes      | —       | Password accepted by /auth/login     |
| PORT           | No       | 8080    | Port the server listens on           |
