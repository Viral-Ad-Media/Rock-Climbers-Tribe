"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Product } from "@/db/schema";
import { deleteProduct } from "../products/actions";
import { wpDate } from "./ui";

export function ProductRow({ product: p, usedIn }: { product: Product; usedIn: { id: number; title: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const shortcode = `[product id="${p.slug}"]`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shortcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <tr style={{ opacity: pending ? 0.5 : 1 }}>
      <th scope="row" className="check-column">
        <input type="checkbox" name="ids" value={p.id} form="products-bulk" aria-label={`Select ${p.name}`} />
      </th>
      <td className="column-thumb hide-mobile">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" width={48} height={48} style={{ width: 48, height: 48, objectFit: "contain", background: "#f6f7f7" }} />
        ) : (
          <span style={{ display: "block", width: 48, height: 48, background: "#f0f0f1" }} />
        )}
      </td>
      <td>
        <strong>
          <Link className="row-title" href={`/admin/products/${p.id}/`}>{p.name}</Link>
          {p.badge && <span className="post-state"> — {p.badge}</span>}
        </strong>
        <div style={{ fontSize: 12, color: "#646970", wordBreak: "break-all" }}>{p.merchant ? `${p.merchant} · ` : ""}{p.url.replace(/^https?:\/\//, "").slice(0, 60)}</div>
        <div className="row-actions">
          <span><Link href={`/admin/products/${p.id}/`}>Edit</Link></span>
          <span><button type="button" onClick={copy}>{copied ? "Copied!" : "Copy shortcode"}</button></span>
          <span><a href={p.url} target="_blank" rel="noopener noreferrer">Visit link</a></span>
          <span className="delete">
            <button
              type="button"
              onClick={() =>
                confirm(`Delete “${p.name}” permanently?${usedIn.length ? ` It is used in ${usedIn.length} post(s); its boxes will disappear from them.` : ""}`) &&
                start(async () => {
                  await deleteProduct(p.id);
                  router.refresh();
                })
              }
            >
              Delete Permanently
            </button>
          </span>
        </div>
      </td>
      <td className="hide-mobile">{p.price ?? "—"}</td>
      <td className="hide-mobile"><code style={{ fontSize: 12 }}>{shortcode}</code></td>
      <td className="hide-mobile">
        {usedIn.length ? (
          usedIn.slice(0, 3).map((u, i) => (
            <span key={u.id}>
              {i > 0 && ", "}
              <Link href={`/admin/posts/${u.id}/`}>{u.title.length > 32 ? `${u.title.slice(0, 32)}…` : u.title}</Link>
            </span>
          ))
        ) : (
          <span style={{ color: "#646970" }}>Not used yet</span>
        )}
        {usedIn.length > 3 && <span style={{ color: "#646970" }}> +{usedIn.length - 3} more</span>}
      </td>
      <td>{p.clicks.toLocaleString()}</td>
      <td className="hide-mobile">Last Modified<br />{wpDate(p.updatedAt)}</td>
    </tr>
  );
}
