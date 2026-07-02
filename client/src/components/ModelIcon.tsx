/**
 * Technical Ledger — model icon.
 * Mono icons are rendered via CSS mask so they inherit currentColor (matches the
 * reference site); full-color icons are rendered as <img>.
 */
import type { Model } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  model: Model;
  className?: string;
  /** pixel size, defaults to 16 */
  size?: number;
}

export function ModelIcon({ model, className, size = 16 }: Props) {
  const dim = { width: size, height: size } as const;

  if (model.is_mono) {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-block shrink-0 bg-current", className)}
        style={{
          ...dim,
          WebkitMaskImage: `url('${model.icon_url}')`,
          maskImage: `url('${model.icon_url}')`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    );
  }

  return (
    <img
      src={model.icon_url}
      alt=""
      aria-hidden="true"
      className={cn("inline-block shrink-0 object-contain", className)}
      style={dim}
    />
  );
}
