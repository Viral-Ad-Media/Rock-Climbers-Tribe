import Link from "next/link";
import { site } from "@/lib/site";
import { AccountLink } from "./account-link";
import { LogoMark } from "./logo";
import { mainNav } from "./nav";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-granite-900 text-granite-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-lg font-bold text-white">{site.name}</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-granite-300">{site.description}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Site</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/search/" className="hover:text-white">
                Search
              </Link>
            </li>
            <li>
              <AccountLink />
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-granite-800">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-granite-500">
          As an Amazon Associate we earn from qualifying purchases. Some links on this site are affiliate links, which
          means we may earn a small commission at no extra cost to you. © {new Date().getFullYear()} {site.name}.
        </p>
      </div>
    </footer>
  );
}
