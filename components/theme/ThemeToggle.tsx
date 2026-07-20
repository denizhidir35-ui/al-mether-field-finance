"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemePreference = "light" | "system" | "dark";

const STORAGE_KEY = "al-mether-theme";
const ORDER: ThemePreference[] = ["light", "system", "dark"];
const LABELS: Record<ThemePreference, string> = {
  light: "Açık tema",
  system: "Sistem temasını kullan",
  dark: "Koyu tema",
};

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "system" || value === "dark";
}

function resolveTheme(preference: ThemePreference) {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme = resolveTheme(preference);
  root.style.colorScheme = root.dataset.theme;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [preference, setPreference] = useState<ThemePreference>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = isThemePreference(stored) ? stored : "light";
    setPreference(initial);
    applyTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = () => {
      if (document.documentElement.dataset.themePreference === "system") applyTheme("system");
    };
    media.addEventListener("change", onSystemThemeChange);
    return () => media.removeEventListener("change", onSystemThemeChange);
  }, []);

  function cycleTheme() {
    const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length];
    window.localStorage.setItem(STORAGE_KEY, next);
    setPreference(next);
    applyTheme(next);
  }

  const Icon = preference === "light" ? Sun : preference === "system" ? Monitor : Moon;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`theme-toggle grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition ${className}`}
      aria-label={`${LABELS[preference]}. Değiştirmek için tıklayın.`}
      title={LABELS[preference]}
    >
      <Icon size={15} />
    </button>
  );
}
