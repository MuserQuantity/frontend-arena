/**
 * Technical Ledger — sticky top bar.
 * Left: MQ brand mark + wordmark. Right: theme toggle + single accent CTA.
 * 52px tall, 1px bottom border, no shadow.
 */
import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="container flex h-[52px] items-center justify-between gap-7">
        <a
          href="/"
          className="group inline-flex items-center gap-2.5 no-underline"
        >
          <img
            src="/logo.png"
            alt="MQ"
            width={24}
            height={24}
            className="block h-6 w-6 object-contain"
          />
          <span className="text-[15px] font-semibold leading-none tracking-tight text-text">
            Frontend Arena
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-[0.14em] text-text-dim border border-border px-1.5 py-0.5">
            MuserQuantity
          </span>
        </a>

        <div className="flex items-center gap-2">
          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
              title={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
              className="flex h-8 w-8 items-center justify-center border border-border text-text-muted transition-colors hover:border-border-strong hover:text-text active:scale-[0.97]"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" strokeWidth={1.8} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.8} />
              )}
            </button>
          )}
          <a
            href="https://github.com/MuserQuantity/frontend-arena"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 bg-text px-4 text-[13px] font-medium text-bg transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-85 active:scale-[0.97]"
          >
            GitHub
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          </a>
        </div>
      </div>
    </header>
  );
}
