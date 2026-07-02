/**
 * Technical Ledger — intro / hero.
 * Left-aligned, editorial. Mono eyebrow, large display headline, muted lede.
 */
import type { Model } from "@/lib/types";
import { ModelIcon } from "./ModelIcon";

interface Props {
  models: Model[];
  taskCount: number;
}

export function Hero({ models, taskCount }: Props) {
  return (
    <section className="border-b border-border pb-10 pt-12 sm:pt-16">
      <div className="eyebrow mb-5">MuserQuantity · Frontend Arena</div>
      <h1 className="max-w-[22ch] text-[clamp(30px,5.2vw,52px)] font-semibold leading-[1.1] tracking-[-0.02em] text-text">
        用真实 LLM&nbsp;Arena 提示词，实测各大模型的前端实力
      </h1>
      <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-text-muted">
        每个站点均由模型基于公开 LLM Arena
        数据集中的单条提示词一次性生成，未经人工修改。点开任意卡片即可体验完整可交互的结果，并在多个模型之间并排切换对比。
      </p>

      {/* Meta row: model roster + counts */}
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-3">
          <span className="eyebrow">模型阵容</span>
          <div className="flex items-center gap-1.5">
            {models.map(m => (
              <span
                key={m.id}
                title={m.name}
                className="flex h-7 w-7 items-center justify-center border border-border bg-surface text-text"
              >
                <ModelIcon model={m} size={15} />
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Stat label="提示词" value={String(taskCount).padStart(2, "0")} />
          <Stat label="模型" value={String(models.length).padStart(2, "0")} />
          <Stat label="预览" value={String(taskCount * models.length)} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="tnum font-mono text-[19px] font-medium leading-none text-text">
        {value}
      </span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}
