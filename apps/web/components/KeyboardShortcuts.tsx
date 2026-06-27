"use client";

import { useEffect } from "react";

export function KeyboardShortcuts({ prevHref, nextHref }: { prevHref: string; nextHref: string }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button")) return;
      if (event.key === "ArrowLeft") window.location.href = nextHref;
      if (event.key === "ArrowRight") window.location.href = prevHref;
      if (event.key === "/") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('input[name="q"]')?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextHref, prevHref]);

  return null;
}
