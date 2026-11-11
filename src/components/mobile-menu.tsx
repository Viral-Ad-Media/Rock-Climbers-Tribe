"use client";

import Link from "next/link";
import { useState } from "react";
import { mainNav } from "./nav";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="rounded-lg p-2 text-granite-800 hover:bg-granite-100"
      >
        <svg viewBox="0 0 20 20" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          {open ? <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" /> : <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />}
        </svg>
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-16 border-b border-granite-100 bg-chalk px-4 pb-4 shadow-sm">
          {[...mainNav, { href: "/search/", label: "Search" }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 font-medium text-granite-800 hover:bg-granite-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
