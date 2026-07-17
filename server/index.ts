/**
 * Frontend Arena server.
 *  - /api/v1/*  REST API per API.md (GET public; mutations need Bearer API_KEY)
 *  - static: uploaded assets (data dir) → client assets (client/public)
 *            → built frontend (dist/public, production)
 * Dev:  PORT=3001 tsx watch server/index.ts   (vite serves the client on 3000)
 * Prod: node dist/index.js                     (single origin for app + API)
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import express from "express";
import { createServer } from "http";
import { createApiRouter } from "./api";
import { loadEnv } from "./env";
import { Store } from "./store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// bundled (dist/index.js) → root is dist/..; tsx dev (server/index.ts) → server/..
const ROOT = path.resolve(__dirname, "..");

async function startServer() {
  loadEnv(ROOT);

  let apiKey = process.env.API_KEY ?? "";
  if (!apiKey) {
    apiKey = crypto.randomBytes(24).toString("hex");
    console.warn(
      `[auth] API_KEY not set — generated a temporary key for this run:\n` +
        `[auth]   ${apiKey}\n` +
        `[auth] set API_KEY in .env to keep a stable key.`
    );
  }

  const dataDir = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(ROOT, "server", "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const store = new Store(dataDir);

  const publicBase = (process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "2mb" }));

  // CORS: reads are public; writes are protected by the API key, so a
  // permissive policy is fine (dev runs the client on another port).
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.use("/api/v1", createApiRouter({ store, dataDir, apiKey, publicBase }));

  // 1) runtime generation assets
  app.use(express.static(dataDir, { index: false }));
  // 2) client assets such as model icons
  app.use(express.static(path.join(ROOT, "client", "public")));
  // 3) built frontend (production)
  const frontendDir =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(ROOT, "dist", "public");
  const hasFrontend = fs.existsSync(path.join(frontendDir, "index.html"));
  if (hasFrontend) app.use(express.static(frontendDir));

  // SPA fallback / 404s
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res
        .status(404)
        .json({
          data: null,
          error: { code: "NOT_FOUND", message: "no such endpoint" },
        });
    }
    if (hasFrontend) return res.sendFile(path.join(frontendDir, "index.html"));
    res
      .status(404)
      .type("text/plain")
      .send(
        "frontend-arena API server (no built frontend found — run `pnpm build`)"
      );
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(
      `[api] base: http://localhost:${port}/api/v1  (data dir: ${dataDir})`
    );
  });
}

startServer().catch(console.error);
