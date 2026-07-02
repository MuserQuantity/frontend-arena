/**
 * Technical Ledger — fullscreen preview modal.
 * Toolbar: model identity + task summary, prev/next model, open raw, close.
 * Stage: sandboxed iframe loading the interactive generated HTML + ring spinner.
 * Keyboard: Esc closes, ArrowLeft/Right switch models. Body scroll locked while open.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Generation, Model, Task } from "@/lib/types";
import { ModelIcon } from "./ModelIcon";
import { PlaceholderThumb } from "./PlaceholderThumb";
import { RingSpinner } from "./RingSpinner";
import { splitModelName } from "@/lib/utils";

export interface PreviewTarget {
  taskIndex: number;
  modelIndex: number;
}

interface Props {
  target: PreviewTarget | null;
  tasks: Task[];
  models: Model[];
  /** generations indexed by taskIndex → (modelId → Generation) */
  generationsByTask: Map<number, Map<string, Generation>>;
  onClose: () => void;
  onChange: (t: PreviewTarget) => void;
}

export function PreviewModal({
  target,
  tasks,
  models,
  generationsByTask,
  onClose,
  onChange,
}: Props) {
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const open = target !== null;

  const task = target ? tasks[target.taskIndex] : undefined;
  const model = target ? models[target.modelIndex] : undefined;
  const genMap = target ? generationsByTask.get(target.taskIndex) : undefined;
  const generation = model ? genMap?.get(model.id) : undefined;

  /** find the next available model index in a direction, skipping missing ones */
  const step = useCallback(
    (dir: 1 | -1): number | null => {
      if (!target || !task) return null;
      const n = models.length;
      for (let t = 1; t < n; t++) {
        const idx = (((target.modelIndex + dir * t) % n) + n) % n;
        const g = genMap?.get(models[idx].id);
        if (g?.status === "ready") return idx;
      }
      return null;
    },
    [target, task, models, genMap]
  );

  const prevIdx = useMemo(() => step(-1), [step]);
  const nextIdx = useMemo(() => step(1), [step]);

  // reset loading whenever the source changes
  useEffect(() => {
    if (target) setLoading(true);
  }, [target?.taskIndex, target?.modelIndex]);

  // focus management: move focus into the dialog on open, restore on close
  useEffect(() => {
    if (!open) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    rootRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [open]);

  // body scroll lock + keyboard handlers (Esc / arrows / Tab focus trap)
  useEffect(() => {
    if (!target) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && prevIdx !== null)
        onChange({ taskIndex: target.taskIndex, modelIndex: prevIdx });
      else if (e.key === "ArrowRight" && nextIdx !== null)
        onChange({ taskIndex: target.taskIndex, modelIndex: nextIdx });
      else if (e.key === "Tab") {
        // keep Tab cycling inside the dialog while it is open
        const root = rootRef.current;
        if (!root) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>(
            'a[href], button:not(:disabled), iframe, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => el.offsetParent !== null);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (!(active instanceof HTMLElement) || !root.contains(active)) {
          e.preventDefault();
          first.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && (active === first || active === root)) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [target, prevIdx, nextIdx, onClose, onChange]);

  if (!target || !task || !model) return null;

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-modal-backdrop outline-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`${model.name} — ${task.summary}`}
    >
      {/* Toolbar */}
      <div className="flex h-[56px] shrink-0 items-center gap-3 border-b border-border-strong bg-bg px-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-surface text-text">
            <ModelIcon model={model} size={17} />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-semibold leading-tight text-text">
              {model.name}
            </span>
            <span className="truncate font-mono text-[11px] leading-tight text-text-dim">
              {String(task.index + 1).padStart(2, "0")} · {task.summary}
            </span>
          </div>
        </div>

        {/* model switcher */}
        <div className="flex items-center">
          <NavBtn
            side="prev"
            disabled={prevIdx === null}
            title={prevIdx !== null ? models[prevIdx].name : undefined}
            label={
              prevIdx !== null ? splitModelName(models[prevIdx].name).base : "—"
            }
            onClick={() =>
              prevIdx !== null &&
              onChange({ taskIndex: target.taskIndex, modelIndex: prevIdx })
            }
          />
          <NavBtn
            side="next"
            disabled={nextIdx === null}
            title={nextIdx !== null ? models[nextIdx].name : undefined}
            label={
              nextIdx !== null ? splitModelName(models[nextIdx].name).base : "—"
            }
            onClick={() =>
              nextIdx !== null &&
              onChange({ taskIndex: target.taskIndex, modelIndex: nextIdx })
            }
          />
        </div>

        <div className="ml-1 flex items-center gap-1">
          {generation && (
            <a
              href={generation.preview_url}
              target="_blank"
              rel="noreferrer"
              className="hidden h-8 items-center gap-1 border border-border px-3 font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted transition-colors hover:border-border-strong hover:text-text sm:inline-flex"
            >
              源页面 <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭预览"
            className="flex h-8 w-8 items-center justify-center border border-border text-text-muted transition-colors hover:border-border-strong hover:text-text active:scale-[0.97]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stage — theme-aware backdrop so dark mode doesn't flash white; the
          iframe itself keeps a white canvas since generated pages assume it. */}
      <div className="relative flex-1 bg-bg">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg">
            <PlaceholderThumb
              color={model.color}
              label={`${model.name} · ${String(task.index + 1).padStart(2, "0")}`}
              className="absolute inset-0 h-full w-full opacity-50"
            />
            <RingSpinner />
          </div>
        )}
        {generation && (
          <iframe
            key={generation.preview_url}
            title={`${model.name} — ${task.summary}`}
            src={generation.preview_url}
            className="h-full w-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-forms"
            onLoad={() => setLoading(false)}
          />
        )}
      </div>
    </div>
  );
}

function NavBtn({
  side,
  label,
  title,
  disabled,
  onClick,
}: {
  side: "prev" | "next";
  label: string;
  title?: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = side === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className="flex h-8 items-center gap-1 border border-border px-2 text-text-muted transition-colors hover:border-border-strong hover:text-text disabled:cursor-default disabled:opacity-40 disabled:hover:border-border [&:not(:first-child)]:border-l-0"
    >
      {side === "prev" && <Icon className="h-4 w-4" />}
      <span className="hidden max-w-[90px] truncate font-mono text-[11px] md:inline">
        {label}
      </span>
      {side === "next" && <Icon className="h-4 w-4" />}
    </button>
  );
}
