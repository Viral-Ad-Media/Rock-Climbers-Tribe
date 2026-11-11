import Link from "next/link";
import { site } from "@/lib/site";
import { LogoMark } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { mainNav } from "./nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-granite-100 bg-chalk/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-lg font-bold tracking-tight">{site.name}</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-granite-700 hover:bg-granite-100 hover:text-granite-900"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/search/"
            aria-label="Search"
            className="ml-1 rounded-full p-2 text-granite-700 hover:bg-granite-100 hover:text-granite-900"
          >
            <SearchIcon />
          </Link>
        </nav>
        <div className="ml-auto md:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="9" r="6" />
      <path d="m14 14 4 4" strokeLinecap="round" />
    </svg>
  );
}
