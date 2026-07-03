# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy all source first, then run go mod tidy.
# This is slightly less cache-efficient than the "COPY go.mod first, then source"
# pattern, but it avoids committing a go.sum file that needs to stay in sync manually.
COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/api

# ── Stage 2: Run ─────────────────────────────────────────────────────────────
# Use a minimal Alpine image — the final image needs no Go toolchain, just the binary.
FROM alpine:3.20

# ca-certificates is required for outbound HTTPS calls (to Node API in production).
RUN apk add --no-cache ca-certificates wget

WORKDIR /app
COPY --from=builder /app/server .

EXPOSE 8080
CMD ["./server"]
