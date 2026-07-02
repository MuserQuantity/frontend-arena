/**
 * Technical Ledger — model preview cell.
 * A squared card: 16:10 thumbnail on top, footer with model identity + state.
 * Ready → clickable "查看"; missing → disabled "待生成" (greyed out).
 * The thumbnail area always renders the model-tinted wireframe placeholder;
 * the real thumbnail (when present) fades in on top once it has loaded.
 */
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Generation, Model } from "@/lib/types";
import { ModelIcon } from "./ModelIcon";
import { PlaceholderThumb } from "./PlaceholderThumb";
import { cn } from "@/lib/utils";

interface Props {
  model: Model;
  /** zero-based task index, used in the placeholder label */
  taskIndex: number;
  generation?: Generation;
  onOpen: () => void;
}

export function ModelCard({ model, taskIndex, generation, onOpen }: Props) {
  const ready = generation?.status === "ready";
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const hasThumb = Boolean(ready && generation?.thumb_url) && !imgFailed;

  return (
    <button
      type="button"
      disabled={!ready}
      aria-disabled={!ready}
      onClick={ready ? onOpen : undefined}
      className={cn(
        "group flex w-full flex-col border border-border bg-surface text-left transition-colors duration-150",
        ready
          ? "hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          : "cursor-default opacity-45"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border bg-surface-strong">
        {/* wireframe placeholder — loading / pending / fallback state */}
        <PlaceholderThumb
          color={model.color}
          label={`${model.name} · ${String(taskIndex + 1).padStart(2, "0")}`}
          className="absolute inset-0 h-full w-full"
        />
        {hasThumb && generation && (
          <img
            src={generation.thumb_url}
            alt=""
            loading="lazy"
            className={cn(
              "relative h-full w-full object-cover transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
          />
        )}
        {ready && (
          <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-0.5 bg-text px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-bg opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            打开
            <ArrowUpRight className="h-3 w-3" strokeWidth={2.2} />
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex min-w-0 flex-1 items-center gap-2 text-text">
          <ModelIcon model={model} size={15} />
          <span className="truncate text-[12.5px] font-medium">
            {model.name}
          </span>
        </span>
        <span
          className={cn(
            "ml-auto inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap font-mono text-[10.5px] tracking-[0.12em]",
            ready
              ? "text-text-dim transition-colors group-hover:text-text"
              : "text-text-dim/70"
          )}
        >
          {ready ? (
            <>
              查看
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            </>
          ) : (
            "待生成"
          )}
        </span>
      </div>
    </button>
  );
}
