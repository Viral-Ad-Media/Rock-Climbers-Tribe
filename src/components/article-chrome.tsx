"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/toc";

/** Thin bar under the header that fills as you read. */
export function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const el = document.getElementById("article-body");
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setPct(Math.min(100, Math.max(0, ((window.innerHeight * 0.4 - r.top) / Math.max(total, 1)) * 100)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-16 z-40 h-1 bg-transparent">
      <div className="h-full origin-left bg-gradient-to-r from-moss-500 to-ember" style={{ transform: `scaleX(${pct / 100})` }} />
    </div>
  );
}

/** Table of contents styled as pitches on a route; highlights the section in view. */
export function TocNav({ toc, title }: { toc: TocItem[]; title: string }) {
  const [active, setActive] = useState(toc[0]?.id);
  useEffect(() => {
    const heads = toc.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = heads.indexOf(e.target as HTMLElement);
          if (e.isIntersecting) setActive(e.target.id);
          // scrolled back up past this heading: the previous section is the current one
          else if (e.boundingClientRect.top > 0 && i > 0) setActive((cur) => (cur === e.target.id ? heads[i - 1].id : cur));
        }
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [toc]);

  return (
    <nav aria-label={title} className="rounded-3xl border border-granite-100 bg-white p-5 shadow-sm shadow-granite-900/5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-granite-500">{title}</p>
      <ol className="relative mt-4 max-h-[65vh] space-y-1 overflow-y-auto pl-1 text-sm">
        <span aria-hidden="true" className="absolute bottom-2 left-[13px] top-2 w-px bg-granite-100" />
        {toc.map((h, i) => {
          const on = h.id === active;
          return (
            <li key={h.id} className="relative">
              <a
                href={`#${h.id}`}
                aria-current={on ? "location" : undefined}
                className={`flex gap-3 rounded-lg py-1.5 pr-2 transition ${on ? "font-semibold text-granite-900" : "text-granite-500 hover:text-moss-700"}`}
              >
                <span
                  className={`relative z-10 mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${
                    on ? "border-moss-600 bg-moss-600 text-white" : "border-granite-200 bg-white text-granite-500"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="leading-snug">{h.text}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
