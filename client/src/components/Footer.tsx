/** Technical Ledger — footer. Minimal, mono, ledger-style meta line. */
export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="MQ"
            width={18}
            height={18}
            className="block h-[18px] w-[18px] object-contain"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-dim">
            Frontend Arena · MuserQuantity
          </span>
        </div>
        <p className="max-w-[52ch] font-mono text-[11px] leading-relaxed text-text-dim">
          所有页面均由各模型基于公开 LLM Arena
          提示词单次生成。预览内容为模型原始输出，可能包含错误。
        </p>
      </div>
    </footer>
  );
}
