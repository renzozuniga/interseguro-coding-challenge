# Interseguro — Full Stack Technical Challenge

A production-ready monorepo implementing two RESTful APIs and a React frontend:

- **Go API** (Fiber) — receives a matrix, runs QR factorization, delegates statistics to the Node API, and returns a combined response.
- **Node.js API** (Express) — internal service that computes statistical metrics (max, min, average, sum, isDiagonal) for the Q and R matrices.
- **Frontend** (React + Vite, served via nginx) — form to enter a matrix and display the decomposition results and statistics.

---

## Architecture

```
Browser
  │
  │  HTTP (port 80)
  ▼
┌─────────────────────────────────────────┐
│  nginx (frontend container)             │
│  ├── serves static React SPA            │
│  └── proxies /api/* → go-api:8080       │
└────────────────┬────────────────────────┘
                 │ HTTP (internal Docker network)
                 ▼
┌─────────────────────────────────────────┐
│  Go API  :8080  (go-api container)      │
│  POST /api/v1/auth/login    (public)    │
│  POST /api/v1/qr-decompose  (JWT auth)  │
│  GET  /health               (public)    │
│                                         │
│  1. Validates + parses input matrix     │
│  2. Runs Householder QR decomposition   │
│  3. ──► calls node-api (with JWT) ────► │
│  4. Merges Q, R, stats → responds       │
└────────────────┬────────────────────────┘
                 │ HTTP (internal Docker network, port 3000)
                 ▼
┌─────────────────────────────────────────┐
│  Node.js API  :3000  (node-api)         │
│  POST /api/v1/matrix-stats  (JWT auth)  │
│  GET  /health               (public)    │
│                                         │
│  Computes per-matrix: max, min,         │
│  average, sum, isDiagonal               │
└─────────────────────────────────────────┘
```

The node-api port is **not published to the host** — it is reachable only by go-api over the internal Docker bridge network.

---

## Design Decisions

### QR factorization vs. matrix rotation

The challenge brief contains an internal inconsistency: the "Architecture" section describes the Go API as performing *matrix rotation*, while the "Required Functionality" section explicitly states *QR factorization*. Rather than guessing intent, I implemented **QR factorization** for the following reasons:

1. **Explicit specification wins.** The functional-requirements section is the normative part of any engineering spec. Architecture descriptions are often written at a higher level of abstraction and lag behind revisions.
2. **QR factorization is a richer technical conversation.** It opens up discussion about numerical stability (Householder vs. Gram-Schmidt), orthogonal matrices, column pivoting, and its applications in least-squares problems and eigenvalue algorithms (QR iteration). Matrix rotation by a fixed angle is a single matrix multiply with little engineering depth.
3. **It's more defensible in a live review.** If the intent truly was rotation, the implementation is easy to add alongside QR without redesigning anything.

### Why Householder reflections (not Gram-Schmidt)?

Classical Gram-Schmidt loses orthogonality when columns are nearly linearly dependent, because floating-point cancellation in the dot products accumulates across steps. Modified Gram-Schmidt is better but still subject to instability in ill-conditioned matrices.

Householder reflectors are exactly orthogonal by construction: each reflection H = I − 2vvᵀ satisfies H² = I and HᵀH = I to machine precision. The backward error of the full algorithm is bounded by O(ε·‖A‖), where ε is machine epsilon (~2.2e−16 for float64). This is the method used by LAPACK's `dgeqrf` and MATLAB's `qr()`.

The trade-off: Householder forms a full m×m Q, while thin QR (from Gram-Schmidt) produces an m×n Q. For an interview demo on small matrices the difference is irrelevant, and the correctness argument for Householder is easier to defend.

### JWT — service token vs. forwarding the user token

When the Go API calls the Node.js API internally, it **mints a short-lived service token** (5-minute TTL) rather than forwarding the end-user's JWT. This means:
- The internal call works even if the user's token expires mid-flight.
- A leaked Node API token cannot be reused as a user token (different `sub` claim).
- In a production system you'd use mutual TLS or a service mesh instead, but for a demo with a shared secret this is a clean separation.

### Validation library (Node.js)

Manual validation was chosen over zod/joi. For a single two-key input shape the overhead of a schema library isn't justified, and explicit validation code makes the rules self-documenting without requiring knowledge of a third-party API.

---

## Quick Start

### Prerequisites

- Docker ≥ 24 and Docker Compose v2

### Run everything

```bash
# Clone and enter the project
cd interseguro-coding-challenge

# Set credentials (or accept the defaults for local testing)
export JWT_SECRET="your-secret-here"
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="changeme"

# Build and start all three services
docker compose up --build
```

| Service    | URL                                  |
|------------|--------------------------------------|
| Frontend   | http://localhost                     |
| Go API     | http://localhost:8080                |
| Node API   | internal only (no host port exposed) |

### Manual API test (no frontend)

```bash
# 1. Get a JWT
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Decompose a 3×2 matrix
curl -s -X POST http://localhost:8080/api/v1/qr-decompose \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"matrix":[[1,2],[3,4],[5,6]]}' | python3 -m json.tool
```

---

## Running services standalone

See the individual READMEs:
- [go-api/README.md](./go-api/README.md)
- [node-api/README.md](./node-api/README.md)
- [frontend/README.md](./frontend/README.md)

---

## Cloud deployment considerations

This project is designed with the following cloud patterns in mind (deployment is not implemented here, only the design):

- **Containerized**: each service is a self-contained image with a minimal footprint.
- **Health checks**: every service exposes `GET /health`, compatible with ECS, GKE, and ALB target groups.
- **Environment-driven config**: no secrets in source code; all are injected via env vars, compatible with AWS Secrets Manager or Parameter Store.
- **Internal networking**: node-api is only reachable within the Docker network, mirroring a VPC-private subnet pattern.
- **Stateless**: both APIs are stateless and horizontally scalable — run multiple replicas behind a load balancer with no shared session state.
