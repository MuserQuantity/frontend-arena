/**
 * Technical Ledger — home page.
 * Data-driven: loads models + tasks (public GET), lazily loads generations per
 * task, and orchestrates the fullscreen preview modal.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Generation, Model, Task } from "@/lib/types";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { TaskIndex } from "@/components/TaskIndex";
import { TaskRow } from "@/components/TaskRow";
import { BackToTop } from "@/components/BackToTop";
import { PreviewModal, type PreviewTarget } from "@/components/PreviewModal";
import { RingSpinner } from "@/components/RingSpinner";

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [genByTask, setGenByTask] = useState<Map<number, Generation[]>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<PreviewTarget | null>(null);

  // initial load: models + tasks
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, t] = await Promise.all([api.getModels(), api.getTasks()]);
        if (cancelled) return;
        setModels(m);
        setTasks(t);
        // fetch generations for all tasks (public GET)
        const entries = await Promise.all(
          t.map(
            async task =>
              [
                task.index,
                await api.getGenerations(task.id, task.index),
              ] as const
          )
        );
        if (cancelled) return;
        setGenByTask(new Map(entries));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // generations indexed for the modal: taskIndex → (modelId → Generation)
  const generationsByTask = useMemo(() => {
    const outer = new Map<number, Map<string, Generation>>();
    genByTask.forEach((list, idx) => {
      const inner = new Map<string, Generation>();
      for (const g of list) inner.set(g.model_id, g);
      outer.set(idx, inner);
    });
    return outer;
  }, [genByTask]);

  const openPreview = useCallback((taskIndex: number, modelIndex: number) => {
    setTarget({ taskIndex, modelIndex });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container flex-1 pb-24">
        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <RingSpinner />
          </div>
        ) : error ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
            <p className="font-mono text-[13px] text-text">数据加载失败。</p>
            <p className="font-mono text-[11px] text-text-dim">{error}</p>
          </div>
        ) : (
          <>
            <Hero models={models} taskCount={tasks.length} />
            <TaskIndex tasks={tasks} />
            <section className="pt-8">
              {tasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  models={models}
                  generations={genByTask.get(task.index) ?? []}
                  onOpenPreview={openPreview}
                />
              ))}
            </section>
          </>
        )}
      </main>

      <Footer />
      <BackToTop />

      <PreviewModal
        target={target}
        tasks={tasks}
        models={models}
        generationsByTask={generationsByTask}
        onClose={() => setTarget(null)}
        onChange={setTarget}
      />
    </div>
  );
}
