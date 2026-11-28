"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type State = "idle" | "loading" | "done";

/**
 * Thin bar at the top while a link navigation is in flight. Starts on a click of a same-origin
 * link to a different page, finishes when the URL changes. Fast navigations never show it
 * (CSS delays it 120 ms). Decorative: Next.js announces the new page to screen readers.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [state, setState] = useState<State>("idle");
  const stateRef = useRef<State>("idle");
  const timers = useRef<number[]>([]);

  function set(next: State) {
    stateRef.current = next;
    setState(next);
  }
  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Capture phase: next/link calls preventDefault() on its own click, so check before it runs.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) {
        // Hash or same page. Next cancels any pending navigation, so the bar must stop too.
        finish();
        return;
      }
      clearTimers();
      set("loading");
      // Never leave a bar hanging if the navigation was abandoned.
      // (e.g. a server redirect back to the current URL, which never changes the pathname).
      timers.current.push(window.setTimeout(() => finish(), 8000));
    }
    function finish() {
      if (stateRef.current !== "loading") return;
      clearTimers();
      set("done");
      timers.current.push(window.setTimeout(() => set("idle"), 450));
    }
    document.addEventListener("click", onClick, true);
    window.addEventListener("lwm:nav-done", finish);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("lwm:nav-done", finish);
      clearTimers();
    };
  }, []);

  // The URL changed: the navigation committed.
  useEffect(() => {
    window.dispatchEvent(new Event("lwm:nav-done"));
  }, [pathname, search]);

  return <div aria-hidden="true" className="nav-progress" data-state={state === "idle" ? undefined : state} />;
}
