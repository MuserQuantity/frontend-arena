/**
 * Technical Ledger — MODELS directory.
 * Every model that has ever joined the arena, newest official release first.
 * Live models show a per-task thumbnail strip (opens the preview modal);
 * archived (deleted) models stay listed as info-only cards.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import type { ArchivedModel, Generation, Model, Task } from "@/lib/types";
import { useArenaData } from "@/hooks/useArenaData";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { Stat } from "@/components/Hero";
import { ModelIcon } from "@/components/ModelIcon";
import { PlaceholderThumb } from "@/components/PlaceholderThumb";
import { PreviewModal, type PreviewTarget } from "@/components/PreviewModal";
import { RingSpinner } from "@/components/RingSpinner";
import { cn, splitModelName } from "@/lib/utils";

type Entry =
  | { kind: "live"; model: Model; modelIndex: number; ready: number }
  | { kind: "archived"; model: ArchivedModel };

type StatusFilter = "all" | "live" | "archived";

const day = (iso?: string) => (iso ? iso.slice(0, 10) : "");
/** sort key: official release date, falling back to the arena join date */
const releaseKey = (m: Model) => m.release_date || day(m.created_at);

export default function Models() {
  const { models, tasks, genByTask, generationsByTask, loading, error } =
    useArenaData();
  const [archived, setArchived] = useState<ArchivedModel[]>([]);
  const [vendor, setVendor] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<PreviewTarget | null>(null);

  useEffect(() => {
    document.title = "模型目录 — Frontend Arena";
    // older servers have no archive endpoint: just show live models
    api.getArchivedModels().then(setArchived, () => setArchived([]));
  }, []);

  const entries = useMemo<Entry[]>(() => {
    const readyBy = new Map<string, number>();
    genByTask.forEach(list => {
      for (const g of list)
        if (g.status === "ready")
          readyBy.set(g.model_id, (readyBy.get(g.model_id) ?? 0) + 1);
    });
    const live = new Set(models.map(m => m.id));
    return [
      ...models.map((model, modelIndex) => ({
        kind: "live" as const,
        model,
        modelIndex,
        ready: readyBy.get(model.id) ?? 0,
      })),
      ...archived
        .filter(m => !live.has(m.id))
        .map(model => ({ kind: "archived" as const, model })),
    ].sort(
      (a, b) =>
        releaseKey(b.model).localeCompare(releaseKey(a.model)) ||
        (b.model.created_at ?? "").localeCompare(a.model.created_at ?? "")
    );
  }, [models, archived, genByTask]);

  // vendor chips: one per shared icon (same as the overview roster)
  const vendors = useMemo(() => {
    const map = new Map<string, { model: Model; names: string[] }>();
    for (const { model } of entries) {
      const v = map.get(model.icon_url);
      if (v) v.names.push(model.name);
      else map.set(model.icon_url, { model, names: [model.name] });
    }
    return Array.from(map, ([icon, v]) => ({ icon, ...v }));
  }, [entries]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      e =>
        (status === "all" || e.kind === status) &&
        (!vendor || e.model.icon_url === vendor) &&
        (!q ||
          e.model.name.toLowerCase().includes(q) ||
          e.model.id.toLowerCase().includes(q))
    );
  }, [entries, status, vendor, query]);

  const archivedCount = entries.filter(e => e.kind === "archived").length;

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
            <section className="border-b border-border pb-10 pt-12 sm:pt-16">
              <div className="eyebrow mb-4">Models · 模型目录</div>
              <h1 className="max-w-[22ch] text-[clamp(30px,5.2vw,52px)] font-semibold leading-[1.1] tracking-[-0.02em] text-text">
                参与评测的全部模型
              </h1>
              <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-text-muted">
                按官方发布时间倒序排列。每张卡片汇总该模型在全部提示词上的生成结果，点击缩略图即可打开可交互预览。已下线的模型同样保留在目录中，只是不再出现在概览页。
              </p>
              <div className="mt-8 flex items-center gap-6">
                <Stat
                  label="模型"
                  value={String(entries.length).padStart(2, "0")}
                />
                <Stat
                  label="在线"
                  value={String(models.length).padStart(2, "0")}
                />
                <Stat
                  label="已下线"
                  value={String(archivedCount).padStart(2, "0")}
                />
              </div>
            </section>

            {/* Toolbar: vendor chips · status · search */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border py-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip active={!vendor} onClick={() => setVendor(null)}>
                  全部
                </Chip>
                {vendors.map(v => (
                  <Chip
                    key={v.icon}
                    active={vendor === v.icon}
                    onClick={() => setVendor(vendor === v.icon ? null : v.icon)}
                    title={v.names.join(" · ")}
                    ariaLabel={v.names.join(" · ")}
                  >
                    <ModelIcon model={v.model} size={14} />
                    <span className="tnum">{v.names.length}</span>
                  </Chip>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                {(
                  [
                    ["all", "全部"],
                    ["live", "在线"],
                    ["archived", "已下线"],
                  ] as const
                ).map(([key, label]) => (
                  <Chip
                    key={key}
                    active={status === key}
                    onClick={() => setStatus(key)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>

              <label className="flex h-8 w-full items-center gap-2 border border-border bg-surface px-2.5 text-text-dim transition-colors focus-within:border-border-strong sm:ml-auto sm:w-56">
                <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="搜索模型"
                  aria-label="搜索模型"
                  className="h-full w-full bg-transparent font-mono text-[12px] text-text outline-none placeholder:text-text-dim"
                />
              </label>
            </div>

            <div className="eyebrow pb-4 pt-6">
              按发布时间倒序 · {visible.length} 个
            </div>

            {visible.length === 0 ? (
              <p className="border border-dashed border-border py-16 text-center font-mono text-[12px] text-text-dim">
                没有符合条件的模型
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-[1024px]:grid-cols-2 max-[640px]:grid-cols-1">
                {visible.map(e => (
                  <ModelEntryCard
                    key={e.model.id}
                    entry={e}
                    tasks={tasks}
                    generationsByTask={generationsByTask}
                    onOpenPreview={openPreview}
                  />
                ))}
              </div>
            )}
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

function Chip({
  active,
  onClick,
  title,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 border px-2.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors duration-150 active:scale-[0.97]",
        active
          ? "border-text bg-surface-strong text-text"
          : "border-border text-text-dim hover:border-border-strong hover:text-text"
      )}
    >
      {children}
    </button>
  );
}

function ModelEntryCard({
  entry,
  tasks,
  generationsByTask,
  onOpenPreview,
}: {
  entry: Entry;
  tasks: Task[];
  generationsByTask: Map<number, Map<string, Generation>>;
  onOpenPreview: (taskIndex: number, modelIndex: number) => void;
}) {
  const { model } = entry;
  const live = entry.kind === "live";
  const { base, tier } = splitModelName(model.name);
  const ready = live ? entry.ready : entry.model.ready_count;
  const total = live ? tasks.length : entry.model.task_count;

  return (
    <article className="flex flex-col border border-border bg-surface">
      {/* Identity */}
      <div className="flex items-start gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-bg text-text">
          <ModelIcon model={model} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2
              title={model.name}
              className="truncate text-[15px] font-medium leading-snug tracking-[-0.01em] text-text"
            >
              {base}
            </h2>
            {tier && (
              <span className="shrink-0 border border-border px-1 py-px font-mono text-[9.5px] uppercase leading-none tracking-[0.08em] text-text-dim">
                {tier}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-text-dim">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 border border-border-strong"
              style={{ background: model.color || "var(--border-strong)" }}
            />
            <span className="truncate">{model.id}</span>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 border px-1.5 py-0.5 font-mono text-[10px] uppercase leading-none tracking-[0.12em]",
            live
              ? "border-border-strong text-text"
              : "border-dashed border-border text-text-dim"
          )}
        >
          {live ? "在线" : "已下线"}
        </span>
      </div>

      {/* Meta */}
      <dl className="grid grid-cols-3 border-t border-border">
        <Meta label="发布" value={model.release_date || "—"} />
        <Meta label="收录" value={day(model.created_at) || "—"} />
        <Meta label="覆盖" value={`${ready}/${total}`} />
      </dl>

      {/* Generations */}
      <div className="mt-auto border-t border-border p-3">
        {live ? (
          <div className="grid grid-cols-5 gap-1.5">
            {tasks.map(task => (
              <ThumbCell
                key={task.id}
                model={model}
                task={task}
                generation={generationsByTask.get(task.index)?.get(model.id)}
                onOpen={() => onOpenPreview(task.index, entry.modelIndex)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 border border-dashed border-border px-3 py-3">
            <div className="flex gap-1">
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1",
                    i < ready ? "bg-text-dim" : "bg-surface-hover"
                  )}
                />
              ))}
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-text-dim">
              {day(entry.model.deleted_at)} 下线 · 生成结果已移除
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-l border-border px-4 py-3 first:border-l-0">
      <dt className="eyebrow text-[10px]">{label}</dt>
      <dd className="tnum font-mono text-[12.5px] text-text">{value}</dd>
    </div>
  );
}

function ThumbCell({
  model,
  task,
  generation,
  onOpen,
}: {
  model: Model;
  task: Task;
  generation?: Generation;
  onOpen: () => void;
}) {
  const ready = generation?.status === "ready";
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const num = String(task.index + 1).padStart(2, "0");

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={ready ? onOpen : undefined}
      title={`${num} · ${task.summary}${ready ? "" : "（待生成）"}`}
      aria-label={`${model.name} · ${num} ${task.summary}`}
      className={cn(
        "group relative aspect-[16/10] w-full overflow-hidden border border-border bg-surface-strong transition-colors duration-150",
        ready
          ? "hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          : "cursor-default opacity-45"
      )}
    >
      <PlaceholderThumb
        color={model.color}
        className="absolute inset-0 h-full w-full"
      />
      {ready && generation.thumb_url && !failed && (
        <img
          src={generation.thumb_url}
          alt=""
          loading="lazy"
          className={cn(
            "relative h-full w-full object-cover transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.05]",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      <span className="tnum absolute bottom-0 left-0 z-10 bg-bg/85 px-1 font-mono text-[9.5px] leading-[14px] text-text-dim">
        {num}
      </span>
    </button>
  );
}
