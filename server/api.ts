/**
 * REST API implementing the contract in API.md.
 *  - GET endpoints are public.
 *  - Mutations require `Authorization: Bearer <API_KEY>`.
 *  - Responses use the { data, error } envelope.
 * Uploaded assets are written under the data dir mirroring the public layout
 * (/sites, /thumbs, /thumbs-mobile) and served statically by index.ts.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { GenerationRow, Store } from "./store";

interface Options {
  store: Store;
  dataDir: string;
  apiKey: string;
  /** absolute origin prefixed to stored relative asset urls in responses */
  publicBase: string;
}

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ data, error: null });
const fail = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ data: null, error: { code, message } });

const statusEnum = z.enum(["ready", "pending", "failed"]);

const modelCreateSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9_-]*$/)
    .optional(),
  name: z.string().min(1).max(80),
  is_mono: z.boolean().optional().default(false),
  icon_url: z.string().max(500).optional().default(""),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{3,8}$/)
    .optional(),
});
const modelPatchSchema = modelCreateSchema.omit({ id: true }).partial();

const taskCreateSchema = z.object({
  summary: z.string().min(1).max(300),
  prompt: z.string().min(1).max(20000),
  index: z.number().int().min(0).optional(),
});
const taskPatchSchema = taskCreateSchema.partial();

const generationPutSchema = z.object({
  preview_url: z.string().max(1000).optional().default(""),
  thumb_url: z.string().max(1000).optional().default(""),
  thumb_mobile_url: z.string().max(1000).optional().default(""),
  status: statusEnum.optional().default("ready"),
});
const generationPatchSchema = z.object({
  preview_url: z.string().max(1000).optional(),
  thumb_url: z.string().max(1000).optional(),
  thumb_mobile_url: z.string().max(1000).optional(),
  status: statusEnum.optional(),
});

function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || `model-${nanoid(6).toLowerCase()}`;
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function createApiRouter({
  store,
  dataDir,
  apiKey,
  publicBase,
}: Options) {
  const router = express.Router();
  const { db } = store;

  // ---- helpers -------------------------------------------------------------

  const withBase = (url: string) =>
    url && url.startsWith("/") ? `${publicBase}${url}` : url;

  const serializeGeneration = (g: GenerationRow) => ({
    ...g,
    preview_url: withBase(g.preview_url),
    thumb_url: withBase(g.thumb_url),
    thumb_mobile_url: withBase(g.thumb_mobile_url ?? ""),
  });

  const serializeTask = (t: (typeof db.tasks)[number]) => ({
    ...t,
    available_models: db.generations
      .filter(g => g.task_id === t.id)
      .map(g => g.model_id),
  });

  const sortedTasks = () => [...db.tasks].sort((a, b) => a.index - b.index);

  /** delete an uploaded file if the (relative) url points inside dataDir */
  const removeAsset = (url: string | undefined) => {
    if (!url || !url.startsWith("/")) return;
    const abs = path.resolve(path.join(dataDir, url));
    if (!abs.startsWith(path.resolve(dataDir) + path.sep)) return;
    fs.rmSync(abs, { force: true });
  };

  const removeGenerationAssets = (g: GenerationRow) => {
    removeAsset(g.preview_url);
    removeAsset(g.thumb_url);
    removeAsset(g.thumb_mobile_url);
  };

  const reindexTasks = () => {
    sortedTasks().forEach((t, i) => {
      t.index = i;
    });
  };

  // ---- auth: GET public, mutations need Bearer key --------------------------

  router.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.method === "GET" ||
      req.method === "HEAD" ||
      req.method === "OPTIONS"
    ) {
      return next();
    }
    const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? "");
    if (!m || !safeEqual(m[1], apiKey)) {
      return fail(res, 401, "UNAUTHORIZED", "missing or invalid API key");
    }
    next();
  });

  // ---- models ---------------------------------------------------------------

  router.get("/models", (_req, res) => ok(res, db.models));

  router.post("/models", (req, res) => {
    const parsed = modelCreateSchema.safeParse(req.body);
    if (!parsed.success)
      return fail(res, 400, "BAD_REQUEST", parsed.error.message);
    const { id: rawId, ...rest } = parsed.data;
    let id = rawId ?? slugify(rest.name);
    if (db.models.some(m => m.id === id)) {
      if (rawId)
        return fail(res, 409, "CONFLICT", `model "${id}" already exists`);
      id = `${id}-${nanoid(4).toLowerCase()}`;
    }
    const model = { id, ...rest, created_at: new Date().toISOString() };
    db.models.push(model);
    store.save();
    ok(res, model, 201);
  });

  router.patch("/models/:id", (req, res) => {
    const model = db.models.find(m => m.id === req.params.id);
    if (!model) return fail(res, 404, "NOT_FOUND", "model not found");
    const parsed = modelPatchSchema.safeParse(req.body);
    if (!parsed.success)
      return fail(res, 400, "BAD_REQUEST", parsed.error.message);
    Object.assign(model, parsed.data);
    store.save();
    ok(res, model);
  });

  router.delete("/models/:id", (req, res) => {
    const idx = db.models.findIndex(m => m.id === req.params.id);
    if (idx === -1) return fail(res, 404, "NOT_FOUND", "model not found");
    for (const g of db.generations.filter(g => g.model_id === req.params.id)) {
      removeGenerationAssets(g);
    }
    db.generations = db.generations.filter(g => g.model_id !== req.params.id);
    const [removed] = db.models.splice(idx, 1);
    store.save();
    ok(res, removed);
  });

  // ---- tasks ----------------------------------------------------------------

  router.get("/tasks", (_req, res) =>
    ok(res, sortedTasks().map(serializeTask))
  );

  router.get("/tasks/:id", (req, res) => {
    const task = db.tasks.find(t => t.id === req.params.id);
    if (!task) return fail(res, 404, "NOT_FOUND", "task not found");
    ok(res, serializeTask(task));
  });

  router.post("/tasks", (req, res) => {
    const parsed = taskCreateSchema.safeParse(req.body);
    if (!parsed.success)
      return fail(res, 400, "BAD_REQUEST", parsed.error.message);
    const { summary, prompt, index } = parsed.data;
    const task = {
      id: `task_${nanoid(8).toLowerCase()}`,
      index: db.tasks.length,
      summary,
      prompt,
      created_at: new Date().toISOString(),
    };
    db.tasks.push(task);
    if (index !== undefined && index < db.tasks.length - 1) {
      const list = sortedTasks().filter(t => t.id !== task.id);
      list.splice(Math.min(index, list.length), 0, task);
      list.forEach((t, i) => {
        t.index = i;
      });
    }
    store.save();
    ok(res, serializeTask(task), 201);
  });

  router.patch("/tasks/:id", (req, res) => {
    const task = db.tasks.find(t => t.id === req.params.id);
    if (!task) return fail(res, 404, "NOT_FOUND", "task not found");
    const parsed = taskPatchSchema.safeParse(req.body);
    if (!parsed.success)
      return fail(res, 400, "BAD_REQUEST", parsed.error.message);
    const { summary, prompt, index } = parsed.data;
    if (summary !== undefined) task.summary = summary;
    if (prompt !== undefined) task.prompt = prompt;
    if (index !== undefined) {
      const list = sortedTasks().filter(t => t.id !== task.id);
      list.splice(Math.min(index, list.length), 0, task);
      list.forEach((t, i) => {
        t.index = i;
      });
    }
    store.save();
    ok(res, serializeTask(task));
  });

  router.delete("/tasks/:id", (req, res) => {
    const idx = db.tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) return fail(res, 404, "NOT_FOUND", "task not found");
    for (const g of db.generations.filter(g => g.task_id === req.params.id)) {
      removeGenerationAssets(g);
    }
    db.generations = db.generations.filter(g => g.task_id !== req.params.id);
    const [removed] = db.tasks.splice(idx, 1);
    reindexTasks();
    store.save();
    ok(res, removed);
  });

  // ---- generations ----------------------------------------------------------

  router.get("/tasks/:id/generations", (req, res) => {
    const task = db.tasks.find(t => t.id === req.params.id);
    if (!task) return fail(res, 404, "NOT_FOUND", "task not found");
    ok(
      res,
      db.generations.filter(g => g.task_id === task.id).map(serializeGeneration)
    );
  });

  const findPair = (req: Request, res: Response) => {
    const task = db.tasks.find(t => t.id === req.params.taskId);
    if (!task) {
      fail(res, 404, "NOT_FOUND", "task not found");
      return null;
    }
    const model = db.models.find(m => m.id === req.params.modelId);
    if (!model) {
      fail(res, 404, "NOT_FOUND", "model not found");
      return null;
    }
    return { task, model };
  };

  router.put("/tasks/:taskId/generations/:modelId", (req, res) => {
    const pair = findPair(req, res);
    if (!pair) return;
    const parsed = generationPutSchema.safeParse(req.body);
    if (!parsed.success)
      return fail(res, 400, "BAD_REQUEST", parsed.error.message);
    const existing = db.generations.find(
      g => g.task_id === pair.task.id && g.model_id === pair.model.id
    );
    const row: GenerationRow = {
      task_id: pair.task.id,
      model_id: pair.model.id,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };
    if (existing) Object.assign(existing, row);
    else db.generations.push(row);
    store.save();
    ok(res, serializeGeneration(existing ?? row), existing ? 200 : 201);
  });

  router.patch("/tasks/:taskId/generations/:modelId", (req, res) => {
    const pair = findPair(req, res);
    if (!pair) return;
    const gen = db.generations.find(
      g => g.task_id === pair.task.id && g.model_id === pair.model.id
    );
    if (!gen) return fail(res, 404, "NOT_FOUND", "generation not found");
    const parsed = generationPatchSchema.safeParse(req.body);
    if (!parsed.success)
      return fail(res, 400, "BAD_REQUEST", parsed.error.message);
    Object.assign(gen, parsed.data, { updated_at: new Date().toISOString() });
    store.save();
    ok(res, serializeGeneration(gen));
  });

  router.delete("/tasks/:taskId/generations/:modelId", (req, res) => {
    const pair = findPair(req, res);
    if (!pair) return;
    const idx = db.generations.findIndex(
      g => g.task_id === pair.task.id && g.model_id === pair.model.id
    );
    if (idx === -1) return fail(res, 404, "NOT_FOUND", "generation not found");
    const [removed] = db.generations.splice(idx, 1);
    removeGenerationAssets(removed);
    store.save();
    ok(res, removed);
  });

  // ---- upload (multipart/form-data: html / thumb / thumb_mobile) ------------

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024, files: 3 },
  });
  const uploadFields = upload.fields([
    { name: "html", maxCount: 1 },
    { name: "thumb", maxCount: 1 },
    { name: "thumb_mobile", maxCount: 1 },
  ]);

  const IMAGE_EXT: Record<string, string> = {
    "image/webp": "webp",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/svg+xml": "svg",
  };

  router.post(
    "/tasks/:taskId/generations/:modelId/upload",
    uploadFields,
    (req, res) => {
      const pair = findPair(req, res);
      if (!pair) return;
      const files = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
      const html = files.html?.[0];
      const thumb = files.thumb?.[0];
      const thumbMobile = files.thumb_mobile?.[0];
      if (!html && !thumb && !thumbMobile) {
        return fail(
          res,
          400,
          "BAD_REQUEST",
          "no file fields (html / thumb / thumb_mobile)"
        );
      }
      if (thumb && !IMAGE_EXT[thumb.mimetype]) {
        return fail(
          res,
          400,
          "BAD_REQUEST",
          `unsupported thumb type ${thumb.mimetype}`
        );
      }
      if (thumbMobile && !IMAGE_EXT[thumbMobile.mimetype]) {
        return fail(
          res,
          400,
          "BAD_REQUEST",
          `unsupported thumb_mobile type ${thumbMobile.mimetype}`
        );
      }

      const nn = String(pair.task.index).padStart(2, "0");
      const mid = pair.model.id;
      const writeAsset = (subdir: string, filename: string, buf: Buffer) => {
        const dir = path.join(dataDir, subdir, nn);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, filename), buf);
        return `/${subdir}/${nn}/${filename}`;
      };

      let gen = db.generations.find(
        g => g.task_id === pair.task.id && g.model_id === pair.model.id
      );
      if (!gen) {
        gen = {
          task_id: pair.task.id,
          model_id: mid,
          preview_url: "",
          thumb_url: "",
          thumb_mobile_url: "",
          status: "pending",
          updated_at: new Date().toISOString(),
        };
        db.generations.push(gen);
      }

      if (html)
        gen.preview_url = writeAsset("sites", `${mid}.html`, html.buffer);
      if (thumb) {
        gen.thumb_url = writeAsset(
          "thumbs",
          `${mid}.${IMAGE_EXT[thumb.mimetype]}`,
          thumb.buffer
        );
      }
      if (thumbMobile) {
        gen.thumb_mobile_url = writeAsset(
          "thumbs-mobile",
          `${mid}.${IMAGE_EXT[thumbMobile.mimetype]}`,
          thumbMobile.buffer
        );
      }
      if (gen.preview_url) gen.status = "ready";
      gen.updated_at = new Date().toISOString();
      store.save();
      ok(res, serializeGeneration(gen));
    }
  );

  // ---- optional cloud generation hook (documented in API.md) ----------------

  router.post("/tasks/:taskId/generate", (_req, res) =>
    fail(res, 501, "NOT_IMPLEMENTED", "cloud generation is not wired up yet")
  );

  return router;
}
