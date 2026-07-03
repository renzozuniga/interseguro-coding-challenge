# ── Stage 1: Install production dependencies ─────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
# npm install --omit=dev produces a node_modules with only production deps.
# If a package-lock.json is present, npm will use it for deterministic installs.
RUN npm install --omit=dev

# ── Stage 2: Run ─────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
