/**
 * Technical Ledger — wireframe placeholder thumbnail.
 * Dynamically rendered skeleton (grid, header bar, text lines, three panels)
 * tinted with the model's brand color. Shown while a real thumbnail is
 * loading, missing, or the generation is still pending.
 * Theme-aware: greys come from CSS variables so it adapts to light/dark.
 */
import { useId } from "react";

interface Props {
  /** model brand color (chosen when the model is created); neutral grey fallback */
  color?: string;
  /** bottom-left mono label, e.g. "Opus 4.7 · 01" */
  label?: string;
  className?: string;
}

export function PlaceholderThumb({ color, label, className }: Props) {
  const c = color || "var(--border-strong)";
  const gridId = useId();

  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <rect width="320" height="200" fill="var(--surface)" />
      <defs>
        <pattern
          id={gridId}
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M20 0H0V20"
            fill="none"
            stroke="var(--surface-hover)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="320" height="200" fill={`url(#${gridId})`} />

      {/* header bar + colored brand block */}
      <rect
        x="24"
        y="26"
        width="272"
        height="20"
        fill="var(--surface-strong)"
      />
      <rect
        x="24"
        y="26"
        width="72"
        height="20"
        fill={c}
        stroke="var(--border-strong)"
        strokeWidth="0.5"
      />

      {/* title + text lines */}
      <rect x="24" y="60" width="180" height="10" fill="var(--border-strong)" />
      <rect x="24" y="78" width="220" height="8" fill="var(--border)" />
      <rect x="24" y="92" width="200" height="8" fill="var(--border)" />

      {/* three panels, last one tinted with the brand color */}
      <rect
        x="24"
        y="120"
        width="80"
        height="46"
        fill="var(--surface-strong)"
        stroke="var(--border)"
      />
      <rect
        x="112"
        y="120"
        width="80"
        height="46"
        fill="var(--surface-strong)"
        stroke="var(--border)"
      />
      <rect x="200" y="120" width="80" height="46" fill={c} opacity="0.12" />
      <rect
        x="200"
        y="120"
        width="80"
        height="46"
        fill="none"
        stroke={c}
        opacity="0.7"
      />

      {label && (
        <text
          x="24"
          y="188"
          fontFamily="var(--font-mono)"
          fontSize="9"
          fill="var(--text-dim)"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
