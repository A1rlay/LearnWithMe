"use client";

import { useRef, useState } from "react";

/** Dark ↔ light. The choice lives in a cookie so the server renders the right theme first. */
export function ThemeToggle({ initial }: { initial: "dark" | "light" }) {
  const [theme, setTheme] = useState(initial);
  // Where the theme is heading. View transitions apply the change a frame later, so neither
  // React state nor the DOM is current when two clicks land inside one frame.
  const target = useRef(initial);
  function toggle() {
    const next = target.current === "light" ? "dark" : "light";
    target.current = next;
    const apply = () => {
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
    // Cross-fade the whole page where the browser supports it; instant swap elsewhere.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !reduce) {
      // A newer click skips the running transition; that rejection is expected, not an error.
      const t = document.startViewTransition(apply);
      t.ready.catch(() => {});
      t.finished.catch(() => {});
    } else apply();
  }
  const toLight = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={toLight ? "Switch to light theme" : "Switch to dark theme"}
      title={toLight ? "Light theme" : "Dark theme"}
      className="press grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      <svg key={theme} className="animate-pop" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {toLight ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  );
}
