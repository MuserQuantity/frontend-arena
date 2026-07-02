/**
 * Technical Ledger — task index (table of contents).
 * A compact multi-column list of anchor links right below the hero so the
 * long single-page grid stays navigable as the task count grows.
 */
import type { Task } from "@/lib/types";
import { taskAnchorId } from "@/lib/utils";

interface Props {
  tasks: Task[];
}

export function TaskIndex({ tasks }: Props) {
  return (
    <nav aria-label="任务目录" className="border-b border-border py-6">
      <div className="eyebrow mb-4">目录 · Index</div>
      <ol className="grid grid-cols-3 gap-x-8 gap-y-1.5 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
        {tasks.map(task => (
          <li key={task.id}>
            <a
              href={`#${taskAnchorId(task.index)}`}
              className="group flex items-baseline gap-2.5 py-0.5 no-underline"
            >
              <span className="tnum shrink-0 font-mono text-[11px] leading-none text-text-dim transition-colors group-hover:text-accent">
                {String(task.index + 1).padStart(2, "0")}
              </span>
              <span className="truncate text-[12.5px] leading-snug text-text-muted transition-colors group-hover:text-text">
                {task.summary}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
