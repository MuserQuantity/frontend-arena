# syntax=docker/dockerfile:1
# Frontend Arena — single-origin production image (app + API on one port).
# Build:  docker build -t frontend-arena .
# Run:    docker run -d -p 3000:3000 -e API_KEY=xxx -v ./server/data:/app/server/data frontend-arena

FROM node:22-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# ---- install all deps (with pnpm patches) -----------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

# ---- build frontend (VITE_API_BASE_URL=/ → same-origin API) + bundle server --
FROM deps AS build
COPY . .
ARG VITE_API_BASE_URL=/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm build

# ---- production node_modules only (dist/index.js keeps packages external) ---
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile --prod

# ---- runtime -----------------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# placeholder sites + model icons served as static fallback by the server
COPY --from=build /app/client/public ./client/public
COPY package.json ./

# db.json + uploaded generations live here — mount a volume to persist
VOLUME /app/server/data

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO /dev/null http://127.0.0.1:3000/api/v1/models || exit 1

CMD ["node", "dist/index.js"]
