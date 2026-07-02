/**
 * Technical Ledger — floating back-to-top button.
 * Squared, 1px border, bottom-right. Fades in after the page has been
 * scrolled past roughly one viewport.
 */
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="回到顶部"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0 })}
      className={cn(
        "fixed bottom-5 right-5 z-30 flex h-9 w-9 items-center justify-center border border-border bg-bg/90 text-text-muted backdrop-blur-sm transition-[opacity,transform,color,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-border-strong hover:text-text active:scale-[0.97]",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      )}
    >
      <ArrowUp className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
