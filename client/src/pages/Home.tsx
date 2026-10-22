/**
 * Technical Ledger — home page (OVERVIEW).
 * Data-driven: loads models + tasks + generations (public GET, shared cache)
 * and orchestrates the fullscreen preview modal.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useArenaData } from "@/hooks/useArenaData";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { TaskIndex } from "@/components/TaskIndex";
import { TaskRow } from "@/components/TaskRow";
import { BackToTop } from "@/components/BackToTop";
import { PreviewModal, type PreviewTarget } from "@/components/PreviewModal";
import { RingSpinner } from "@/components/RingSpinner";

export default function Home() {
  const { models, tasks, genByTask, generationsByTask, loading, error } =
    useArenaData();
  const [target, setTarget] = useState<PreviewTarget | null>(null);

  useEffect(() => {
    document.title = "Frontend Arena — 大模型前端实力对比";
  }, []);

  // hero 预览计数：只统计真实 ready 的体验卡，排除待生成/失败
  const previewCount = useMemo(() => {
    let n = 0;
    genByTask.forEach(list => {
      for (const g of list) if (g.status === "ready") n++;
    });
    return n;
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
            <Hero
              models={models}
              taskCount={tasks.length}
              previewCount={previewCount}
            />
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
