import Link from "next/link";
import { scoreBand } from "@/lib/seo/analyze";

export function PageHeading({ title, action, children }: { title: string; action?: { label: string; href: string }; children?: React.ReactNode }) {
  return (
    <div className="wp-heading">
      <h1>{title}</h1>
      {action && (
        <Link href={action.href} className="page-title-action">
          {action.label}
        </Link>
      )}
      {children}
    </div>
  );
}

export function Notice({ type = "success", children }: { type?: "success" | "error" | "warning" | "info"; children: React.ReactNode }) {
  return (
    <div className={`wp-notice ${type === "success" ? "" : type}`} role={type === "error" ? "alert" : "status"}>
      <p>{children}</p>
    </div>
  );
}

export function SubSubSub({ items }: { items: { label: string; href: string; count?: number; current?: boolean }[] }) {
  return (
    <ul className="subsubsub">
      {items.map((i) => (
        <li key={i.href}>
          <Link href={i.href} className={i.current ? "current" : ""} aria-current={i.current ? "page" : undefined}>
            {i.label} {i.count !== undefined && <span className="count">({i.count})</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** "10 items  « ‹ 1 of 3 › »" */
export function Pagination({ total, page, perPage, hrefFor }: { total: number; page: number; perPage: number; hrefFor: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const btn = (p: number, label: string, title: string) =>
    p < 1 || p > pages || p === page ? (
      <span className="page-btn" aria-hidden="true">{label}</span>
    ) : (
      <Link className="page-btn" href={hrefFor(p)} title={title}>{label}</Link>
    );
  return (
    <div className="tablenav-pages">
      <span>{total} {total === 1 ? "item" : "items"}</span>
      {pages > 1 && (
        <>
          {btn(1, "«", "First page")}
          {btn(page - 1, "‹", "Previous page")}
          <span>
            {page} of {pages}
          </span>
          {btn(page + 1, "›", "Next page")}
          {btn(pages, "»", "Last page")}
        </>
      )}
    </div>
  );
}

export function ScoreBadge({ score, keyword }: { score: number | null | undefined; keyword?: string | null }) {
  if (score === null || score === undefined || !keyword) {
    return <span className="seo-score none" title="No focus keyword set">N/A</span>;
  }
  return <span className={`seo-score ${scoreBand(score)}`}>{score} / 100</span>;
}

export function Postbox({ title, children, className = "" }: { title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`postbox ${className}`}>
      <div className="postbox-header">
        <h2>{title}</h2>
      </div>
      <div className="inside">{children}</div>
    </div>
  );
}

/** WordPress-style "2026/01/10 at 4:43 am" */
export function wpDate(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = date.getHours();
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} at ${h % 12 || 12}:${pad(date.getMinutes())} ${h < 12 ? "am" : "pm"}`;
}

export function qs(base: Record<string, string | undefined>, patch: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v !== undefined && v !== "" && v !== null) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}
