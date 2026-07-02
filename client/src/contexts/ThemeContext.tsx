import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  switchable?: boolean;
}

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const readStored = (): Theme | null => {
  try {
    const s = localStorage.getItem("theme");
    return s === "light" || s === "dark" ? s : null;
  } catch {
    return null;
  }
};

export function ThemeProvider({
  children,
  switchable = false,
}: ThemeProviderProps) {
  // Follow the system preference until the user explicitly toggles; an
  // explicit choice is persisted and wins over the system on later visits.
  // (Matches the pre-paint script in index.html.)
  const [explicit, setExplicit] = useState<Theme | null>(() =>
    switchable ? readStored() : null
  );
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const theme = explicit ?? systemTheme;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Live-update when the OS theme changes (while no explicit choice is set).
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(getSystemTheme());
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = switchable
    ? () => {
        const next: Theme = theme === "light" ? "dark" : "light";
        setExplicit(next);
        try {
          localStorage.setItem("theme", next);
        } catch {
          /* storage unavailable (e.g. private mode) — theme still applies */
        }
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
