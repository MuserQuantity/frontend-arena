/**
 * API service layer.
 *
 * Two modes:
 *  - MOCK (default): resolves from the bundled mock dataset with a small delay.
 *  - REAL: talks to the backend REST API documented in API.md.
 *
 * Switching is controlled by `VITE_API_BASE_URL`. When it is empty, the mock
 * branch is used, so the UI runs fully standalone until the backend exists.
 *
 * Read endpoints (GET) are public and require no auth.
 * Write endpoints require `Authorization: Bearer <API_KEY>` — the frontend here
 * only consumes read endpoints, but the write helpers are provided for
 * completeness / admin tooling.
 */
import type { Generation, Model, Task } from "./types";
import { MODELS, TASKS } from "./mockData";

// Any non-empty value switches to the real API; "/" means same-origin
// (the production server hosts app + API together).
const RAW_BASE = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""
).trim();
const BASE = RAW_BASE.replace(/\/$/, "");
const USE_MOCK = RAW_BASE.length === 0;

/** Asset path helpers (mirror the reference site's folder layout). */
export const assetPaths = {
  preview: (taskIndex: number, modelId: string) =>
    `/sites/${String(taskIndex).padStart(2, "0")}/${modelId}.html`,
  // Real backend serves .webp thumbnails; while a thumb is missing the UI
  // auto-renders a wireframe placeholder tinted with the model's color.
  thumb: (taskIndex: number, modelId: string) =>
    `/thumbs/${String(taskIndex).padStart(2, "0")}/${modelId}.webp`,
  thumbMobile: (taskIndex: number, modelId: string) =>
    `/thumbs-mobile/${String(taskIndex).padStart(2, "0")}/${modelId}.webp`,
  // icons are per-vendor (claude/gemini/glm/gpt/minimax...), shared across versions
  icon: (vendor: string) => `/model-icons/${vendor}.svg`,
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  const body = await res.json();
  return (body.data ?? body) as T;
}

export const api = {
  /** GET /api/v1/models — public */
  async getModels(): Promise<Model[]> {
    if (USE_MOCK) {
      await delay(120);
      return MODELS;
    }
    return getJSON<Model[]>("/api/v1/models");
  },

  /** GET /api/v1/tasks — public. Includes each task's available model manifest. */
  async getTasks(): Promise<Task[]> {
    if (USE_MOCK) {
      await delay(260);
      return TASKS;
    }
    return getJSON<Task[]>("/api/v1/tasks");
  },

  /** GET /api/v1/tasks/:id/generations — public. */
  async getGenerations(
    taskId: string,
    taskIndex: number
  ): Promise<Generation[]> {
    if (USE_MOCK) {
      await delay(80);
      const task = TASKS.find(t => t.id === taskId);
      const ids = task?.available_models ?? [];
      return ids.map(mid => ({
        task_id: taskId,
        model_id: mid,
        preview_url: assetPaths.preview(taskIndex, mid),
        // mock has no real thumbnails — empty url makes the UI render the
        // model-tinted wireframe placeholder instead
        thumb_url: "",
        thumb_mobile_url: "",
        status: "ready" as const,
      }));
    }
    return getJSON<Generation[]>(`/api/v1/tasks/${taskId}/generations`);
  },
};
