"use client";

import { useEffect } from "react";

export function ScrollCurrentToc({ containerId }: { containerId: string }) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    const current = container?.querySelector<HTMLElement>('[data-current-toc="true"]');
    if (!container || !current) return;

    const top = current.offsetTop - container.clientHeight / 2 + current.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [containerId]);

  return null;
}
