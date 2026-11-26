"use client";

import { useEffect, useRef, useState } from "react";

export type FilterOption = { id: string; label: string; count: number };

/**
 * Filter chips for the blog grid. Every card is rendered on the server (so crawlers and
 * no-JS visitors see them all); this only hides the ones that don't match. Each card
 * carries its filter ids in `data-filters`. The choice is kept in the URL hash.
 */
export function BlogFilter({ options, gridId }: { options: FilterOption[]; gridId: string }) {
  const [active, setActive] = useState("all");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace("#", "");
      if (options.some((o) => o.id === h)) setActive(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [options]);

  useEffect(() => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.querySelectorAll<HTMLElement>("[data-filters]").forEach((el) => {
      const match = active === "all" || el.dataset.filters!.split(" ").includes(active);
      el.hidden = !match;
    });
  }, [active, gridId]);

  function choose(id: string) {
    setActive(id);
    history.replaceState(null, "", id === "all" ? window.location.pathname : `#${id}`);
    const top = ref.current?.getBoundingClientRect().top ?? 0;
    if (top < 0 || top > window.innerHeight) ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div ref={ref} className="sticky top-16 z-30 -mx-4 scroll-mt-16 border-b border-granite-100 bg-chalk/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div role="toolbar" aria-label="Filter articles" className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {options.map((o) => {
            const on = o.id === active;
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={on}
                onClick={() => choose(o.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  on
                    ? "border-granite-900 bg-granite-900 text-white"
                    : "border-granite-200 bg-white text-granite-700 hover:border-granite-900 hover:text-granite-900"
                }`}
              >
                {o.label}
                <span className={`rounded-full px-1.5 text-xs ${on ? "bg-white/15 text-white" : "bg-granite-100 text-granite-500"}`}>{o.count}</span>
              </button>
            );
          })}
        </div>
        <p aria-live="polite" className="hidden shrink-0 text-sm text-granite-500 sm:block">
          Showing {options.find((o) => o.id === active)?.count ?? 0}
        </p>
      </div>
    </div>
  );
}
