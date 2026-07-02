/**
 * JSON-file backed store for the arena data (models / tasks / generations).
 * Scale is tiny (dozens of rows), so a single db.json with atomic writes is
 * plenty. On first boot the store is seeded from the client mock dataset so
 * the API serves the exact content the standalone frontend ships with.
 * Generation asset urls are stored RELATIVE ("/sites/00/x.html"); the API
 * layer prefixes PUBLIC_BASE_URL when serializing responses.
 */
import fs from "node:fs";
import path from "node:path";
import { MODELS, TASKS } from "../client/src/lib/mockData";

export interface ModelRow {
  id: string;
  name: string;
  is_mono: boolean;
  icon_url: string;
  color?: string;
  created_at: string;
}

export interface TaskRow {
  id: string;
  index: number;
  summary: string;
  prompt: string;
  created_at: string;
}

export type GenerationStatus = "ready" | "pending" | "failed";

export interface GenerationRow {
  task_id: string;
  model_id: string;
  preview_url: string;
  thumb_url: string;
  thumb_mobile_url?: string;
  status: GenerationStatus;
  updated_at: string;
}

export interface DB {
  models: ModelRow[];
  tasks: TaskRow[];
  generations: GenerationRow[];
}

function seed(): DB {
  const now = new Date().toISOString();
  const models: ModelRow[] = MODELS.map(m => ({ ...m, created_at: now }));
  const tasks: TaskRow[] = TASKS.map(t => ({
    id: t.id,
    index: t.index,
    summary: t.summary,
    prompt: t.prompt,
    created_at: now,
  }));
  const generations: GenerationRow[] = TASKS.flatMap(t =>
    t.available_models.map(mid => ({
      task_id: t.id,
      model_id: mid,
      preview_url: `/sites/${String(t.index).padStart(2, "0")}/${mid}.html`,
      thumb_url: "", // empty → the UI renders the model-tinted placeholder
      thumb_mobile_url: "",
      status: "ready" as const,
      updated_at: now,
    }))
  );
  return { models, tasks, generations };
}

export class Store {
  readonly db: DB;
  private readonly file: string;

  constructor(dataDir: string) {
    this.file = path.join(dataDir, "db.json");
    if (fs.existsSync(this.file)) {
      this.db = JSON.parse(fs.readFileSync(this.file, "utf-8")) as DB;
    } else {
      this.db = seed();
      this.save();
      console.log(`[store] seeded ${this.file} from mock dataset`);
    }
  }

  /** Atomic-ish persist: write to a temp file, then rename over db.json. */
  save() {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2), "utf-8");
    fs.renameSync(tmp, this.file);
  }
}
