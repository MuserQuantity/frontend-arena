/**
 * Shared runtime data loader for the Overview and Models pages.
 * Loads models + tasks + per-task generations once per session (module-level
 * cache) so switching pages does not refetch or flash the spinner.
 */
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Generation, Model, Task } from "@/lib/types";

interface ArenaData {
  models: Model[];
  tasks: Task[];
  genByTask: Map<number, Generation[]>;
}

const EMPTY = new Map<number, Generation[]>();
let cache: Promise<ArenaData> | null = null;

function load(): Promise<ArenaData> {
  cache ??= (async () => {
    const [models, tasks] = await Promise.all([
      api.getModels(),
      api.getTasks(),
    ]);
    const entries = await Promise.all(
      tasks.map(
        async task => [task.index, await api.getGenerations(task.id)] as const
      )
    );
    return { models, tasks, genByTask: new Map(entries) };
  })().catch(e => {
    cache = null;
    throw e;
  });
  return cache;
}

export function useArenaData() {
  const [data, setData] = useState<ArenaData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then(
      d => !cancelled && setData(d),
      e => !cancelled && setError(e instanceof Error ? e.message : "加载失败")
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // generations indexed for the modal: taskIndex → (modelId → Generation)
  const generationsByTask = useMemo(() => {
    const outer = new Map<number, Map<string, Generation>>();
    data?.genByTask.forEach((list, idx) => {
      outer.set(idx, new Map(list.map(g => [g.model_id, g])));
    });
    return outer;
  }, [data]);

  return {
    models: data?.models ?? [],
    tasks: data?.tasks ?? [],
    genByTask: data?.genByTask ?? EMPTY,
    generationsByTask,
    loading: !data && !error,
    error,
  };
}
