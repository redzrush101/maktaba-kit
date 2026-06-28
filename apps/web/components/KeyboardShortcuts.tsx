"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function KeyboardShortcuts({ prevHref, nextHref }: { prevHref: string; nextHref: string }) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button")) return;
      if (event.key === "ArrowLeft") router.push(nextHref);
      if (event.key === "ArrowRight") router.push(prevHref);
      if (event.key === "/") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('input[name="q"]')?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextHref, prevHref, router]);

  return null;
}
