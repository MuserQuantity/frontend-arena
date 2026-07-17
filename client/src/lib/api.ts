/**
 * API service layer for runtime-managed models, tasks, prompts, and generations.
 * Read endpoints are public; mutations require a server-side API key.
 */
import type { Generation, Model, Task } from "./types";

const RAW_BASE = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/"
).trim();
const BASE = RAW_BASE === "/" ? "" : RAW_BASE.replace(/\/$/, "");

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
    return getJSON<Model[]>("/api/v1/models");
  },

  /** GET /api/v1/tasks — public. Includes each task's available model manifest. */
  async getTasks(): Promise<Task[]> {
    return getJSON<Task[]>("/api/v1/tasks");
  },

  /** GET /api/v1/tasks/:id/generations — public. */
  async getGenerations(taskId: string): Promise<Generation[]> {
    return getJSON<Generation[]>(`/api/v1/tasks/${taskId}/generations`);
  },
};
