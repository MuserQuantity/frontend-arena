/**
 * Technical Ledger — sticky top bar.
 * Left: MQ brand mark + wordmark + page nav (OVERVIEW / MODELS).
 * Right: theme toggle + single accent CTA.
 * 52px tall, 1px bottom border, no shadow. On mobile the nav drops to a
 * second 40px row (see --topbar-h in index.css).
 */
import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/models", label: "Models" },
] as const;

function NavLinks({ className }: { className?: string }) {
  const [location] = useLocation();
  return (
    <nav
      aria-label="主导航"
      className={cn("flex items-stretch gap-6", className)}
    >
      {NAV.map(item => {
        const active = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center font-mono text-[11.5px] uppercase tracking-[0.14em] no-underline transition-colors duration-150",
              active
                ? "text-text after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-text"
                : "text-text-dim hover:text-text"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="container flex h-[52px] items-center justify-between gap-7">
        <div className="flex items-center gap-7 self-stretch">
          <Link
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
          </Link>
          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-border sm:block"
          />
          <NavLinks className="hidden self-stretch sm:flex" />
        </div>

        <div className="flex items-center gap-2">
          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark" ? "切换到浅色主题" : "切换到深色主题"
              }
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
      <div className="border-t border-border sm:hidden">
        <NavLinks className="container h-10" />
      </div>
    </header>
  );
}
