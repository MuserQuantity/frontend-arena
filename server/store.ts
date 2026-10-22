/**
 * JSON-file backed store for runtime-managed models, tasks, and generations.
 * Generation asset urls are stored relative to the data directory; the API
 * layer prefixes PUBLIC_BASE_URL when serializing responses.
 */
import fs from "node:fs";
import path from "node:path";

export interface ModelRow {
  id: string;
  name: string;
  is_mono: boolean;
  icon_url: string;
  color?: string;
  /** official release (GA) date, YYYY-MM-DD */
  release_date?: string;
  created_at: string;
}

/** A deleted model kept for the Models directory (its generations are gone). */
export interface ArchivedModelRow extends ModelRow {
  deleted_at: string;
  /** ready generations / total tasks at deletion time */
  ready_count: number;
  task_count: number;
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
  archived_models: ArchivedModelRow[];
}

function seed(): DB {
  return { models: [], tasks: [], generations: [], archived_models: [] };
}

export class Store {
  readonly db: DB;
  private readonly file: string;

  constructor(dataDir: string) {
    this.file = path.join(dataDir, "db.json");
    if (fs.existsSync(this.file)) {
      this.db = JSON.parse(fs.readFileSync(this.file, "utf-8")) as DB;
      this.db.archived_models ??= [];
    } else {
      this.db = seed();
      this.save();
      console.log(`[store] initialized empty runtime database at ${this.file}`);
    }
  }

  /** Atomic-ish persist: write to a temp file, then rename over db.json. */
  save() {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2), "utf-8");
    fs.renameSync(tmp, this.file);
  }
}
