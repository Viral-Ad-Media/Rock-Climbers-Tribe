"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/db/schema";
import { listProducts } from "../products/actions";

/** "Add Product" dialog in the post editor: pick one product for a box, or several for a comparison table. */
export function ProductModal({ onClose, onInsert }: { onClose: () => void; onInsert: (html: string) => void }) {
  const [items, setItems] = useState<Product[] | null>(null);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => listProducts(search).then((r) => live && setItems(r)), search ? 250 : 0);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [search]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));
  const insert = (kind: "box" | "table") =>
    onInsert(kind === "box" ? picked.map((s) => `<p>[product id="${s}"]</p>`).join("") : `<p>[products ids="${picked.join(",")}"]</p>`);

  return (
    <>
      <div className="media-modal-backdrop" onClick={onClose} />
      <div className="media-modal" role="dialog" aria-modal="true" aria-label="Add product">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid #dcdcde" }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: "14px 0" }}>Add Product</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" style={{ fontSize: 26, color: "#646970", width: 40, height: 40 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <p style={{ margin: 0, color: "#50575e" }}>Pick one product for a product box, or several for boxes or a comparison table.</p>
            <input type="search" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
          </div>
          {!items ? (
            <p>Loading…</p>
          ) : items.length === 0 ? (
            <p>
              {search ? "No products match." : "No products yet."}{" "}
              <Link href="/admin/products/new/" target="_blank">Add a product</Link> (opens in a new tab), then search again.
            </p>
          ) : (
            <div className="product-picker">
              {items.map((p) => {
                const n = picked.indexOf(p.slug);
                return (
                  <button key={p.id} type="button" className={n >= 0 ? "selected" : ""} onClick={() => toggle(p.slug)} aria-pressed={n >= 0}>
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" />
                    ) : (
                      <span className="ph" />
                    )}
                    <span style={{ minWidth: 0 }}>
                      <strong style={{ display: "block" }}>{n >= 0 ? `${n + 1}. ` : ""}{p.name}</strong>
                      <span style={{ fontSize: 12, color: "#646970" }}>{[p.price, p.merchant].filter(Boolean).join(" · ") || p.slug}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ borderTop: "1px solid #dcdcde", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ color: "#646970" }}>{picked.length ? `${picked.length} selected` : "Nothing selected"}</span>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" className="wp-btn wp-btn-large" disabled={picked.length < 2} onClick={() => insert("table")}>Insert comparison table</button>
            <button type="button" className="wp-btn wp-btn-primary wp-btn-large" disabled={!picked.length} onClick={() => insert("box")}>
              Insert product box{picked.length > 1 ? "es" : ""}
            </button>
          </span>
        </div>
      </div>
    </>
  );
}
