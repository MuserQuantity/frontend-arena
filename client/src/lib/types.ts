/**
 * Domain types shared across the app.
 * These mirror the backend REST contract documented in API.md so the frontend
 * can switch from the local mock service to the real API without code changes.
 */

export interface Model {
  /** stable id, also used to resolve icon/asset paths, e.g. "claude-opus-4_7" */
  id: string;
  /** display name, e.g. "Opus 4.7" */
  name: string;
  /** single-color icon rendered via CSS mask when true; full-color <img> when false */
  is_mono: boolean;
  /** absolute or relative url to the model icon (svg) */
  icon_url: string;
  /**
   * brand color (色系) chosen when the model is created, e.g. "#d97706".
   * Used to auto-render the wireframe placeholder thumbnails while a real
   * thumbnail is loading / missing. Falls back to a neutral grey when unset.
   */
  color?: string;
}

export interface Task {
  /** stable id, e.g. "task_00" */
  id: string;
  /** zero-based ordering index used for numbering and asset folder names */
  index: number;
  /** short one-line summary shown on the task head */
  summary: string;
  /** full original prompt shown when the row is expanded */
  prompt: string;
  /** model ids that have a ready generation for this task */
  available_models: string[];
}

/** A single generated result for one (task, model) pair. */
export interface Generation {
  task_id: string;
  model_id: string;
  /** url to the interactive standalone HTML preview (loaded in an iframe) */
  preview_url: string;
  /** desktop thumbnail (webp) */
  thumb_url: string;
  /** mobile thumbnail (webp), optional */
  thumb_mobile_url?: string;
  status: "ready" | "pending" | "failed";
}
