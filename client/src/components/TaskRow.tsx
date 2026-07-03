/**
 * Technical Ledger — a single task row.
 * Head: number + summary + "+ 完整提示词" toggle.
 * Detail: collapsible full prompt with an accent left rule.
 * Grid: model cells (5-up desktop, 2-up tablet, horizontal snap carousel mobile).
 */
import { useMemo, useState } from "react";
import type { Generation, Model, Task } from "@/lib/types";
import { ModelCard } from "./ModelCard";
import { taskAnchorId } from "@/lib/utils";

interface Props {
  task: Task;
  models: Model[];
  generations: Generation[];
  onOpenPreview: (taskIndex: number, modelIndex: number) => void;
}

export function TaskRow({ task, models, generations, onOpenPreview }: Props) {
  const [open, setOpen] = useState(false);
  const num = String(task.index + 1).padStart(2, "0");

  const genByModel = useMemo(() => {
    const map = new Map<string, Generation>();
    for (const g of generations) map.set(g.model_id, g);
    return map;
  }, [generations]);

  return (
    <article
      id={taskAnchorId(task.index)}
      className="scroll-mt-[calc(var(--topbar-h)+12px)] border-b border-border py-6 first:pt-0"
    >
      {/* Head */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="group flex w-full items-baseline gap-4 text-left"
      >
        <span className="tnum shrink-0 font-mono text-[13px] leading-none text-text-dim">
          {num}
        </span>
        <span className="flex-1 text-[16px] font-medium leading-snug tracking-[-0.01em] text-text">
          {task.summary}
        </span>
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim transition-colors group-hover:text-text">
          {open ? "− 完整提示词" : "+ 完整提示词"}
        </span>
      </button>

      {/* Detail */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <pre className="mt-4 whitespace-pre-wrap border-l-2 border-text bg-surface px-4 py-3 font-mono text-[12.5px] leading-relaxed text-text-muted">
            {task.prompt}
          </pre>
        </div>
      </div>

      {/* Grid / mobile carousel */}
      <div className="mt-5 grid grid-cols-5 gap-3 max-[900px]:grid-cols-2 max-[760px]:flex max-[760px]:snap-x max-[760px]:snap-mandatory max-[760px]:gap-3 max-[760px]:overflow-x-auto max-[760px]:pb-1 no-scrollbar">
        {models.map((m, i) => (
          <div
            key={m.id}
            className="max-[760px]:w-[78%] max-[760px]:shrink-0 max-[760px]:snap-start"
          >
            <ModelCard
              model={m}
              taskIndex={task.index}
              generation={genByModel.get(m.id)}
              onOpen={() => onOpenPreview(task.index, i)}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
