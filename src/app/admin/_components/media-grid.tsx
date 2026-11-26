"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMedia, type MediaItem } from "../media/actions";
import { AttachmentDetails } from "./media-modal";

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [pending, start] = useTransition();
  if (!items.length) return <p>No media files found.</p>;
  return (
    <>
      <div className="media-grid">
        {items.map((m) => (
          <button key={m.id} type="button" className={`attachment ${selected?.id === m.id ? "selected" : ""}`} onClick={() => setSelected(m)} title={m.filename}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.alt ?? ""} loading="lazy" />
          </button>
        ))}
      </div>
      {selected && (
        <>
          <div className="media-modal-backdrop" onClick={() => setSelected(null)} />
          <div className="media-modal" role="dialog" aria-modal="true" aria-label="Attachment details">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #dcdcde" }}>
              <h2 style={{ fontSize: 22, fontWeight: 600, margin: "14px 0" }}>Attachment details</h2>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" style={{ fontSize: 26, width: 40, height: 40, color: "#646970" }}>×</button>
            </div>
            <div style={{ flex: 1, display: "flex", minHeight: 0, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 400px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f1", padding: 16, minHeight: 200 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.url} alt={selected.alt ?? ""} style={{ maxWidth: "100%", maxHeight: "70vh" }} />
              </div>
              <aside style={{ flex: "0 1 320px", padding: 16, overflowY: "auto", background: "#f6f7f7" }}>
                <AttachmentDetails key={selected.id} item={selected} onChange={() => router.refresh()} />
                <p style={{ marginTop: 16 }}>
                  <a href={selected.url} target="_blank" rel="noreferrer">View media file</a> |{" "}
                  <button
                    type="button"
                    className="wp-link-delete"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm("You are about to permanently delete this item from your site. This action cannot be undone.")) return;
                      start(async () => {
                        await deleteMedia([selected.id]);
                        setSelected(null);
                        router.refresh();
                      });
                    }}
                  >
                    Delete permanently
                  </button>
                </p>
              </aside>
            </div>
          </div>
        </>
      )}
    </>
  );
}
