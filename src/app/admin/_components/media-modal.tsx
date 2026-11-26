"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { listMedia, updateMedia, uploadMedia, type MediaItem } from "../media/actions";

export function Uploader({ onUploaded }: { onUploaded: (items: MediaItem[]) => void }) {
  const [over, setOver] = useState(false);
  const [busy, start] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const send = (files: FileList | File[]) => {
    const fd = new FormData();
    for (const f of Array.from(files)) fd.append("files", f);
    start(async () => {
      const res = await uploadMedia(fd);
      setErrors(res.errors);
      if (res.items.length) onUploaded(res.items);
    });
  };

  return (
    <div
      className={`uploader-drop ${over ? "over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) send(e.dataTransfer.files);
      }}
    >
      <p style={{ fontSize: 20, margin: "0 0 8px", color: "#1d2327" }}>Drop files to upload</p>
      <p style={{ margin: "0 0 12px" }}>or</p>
      <button type="button" className="wp-btn wp-btn-large" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? "Uploading…" : "Select Files"}
      </button>
      <input ref={input} type="file" multiple accept="image/*,application/pdf" hidden onChange={(e) => e.target.files && send(e.target.files)} />
      <p style={{ marginTop: 12, fontSize: 12 }}>Maximum upload file size: 4 MB.</p>
      {errors.map((e) => (
        <p key={e} style={{ color: "#d63638" }}>{e}</p>
      ))}
    </div>
  );
}

export function AttachmentDetails({ item, onChange }: { item: MediaItem; onChange?: (item: MediaItem) => void }) {
  const [values, setValues] = useState({ alt: item.alt ?? "", title: item.title ?? "", caption: item.caption ?? "" });
  const [status, setStatus] = useState<"" | "saving" | "saved">("");

  const save = async () => {
    setStatus("saving");
    await updateMedia(item.id, values);
    setStatus("saved");
    onChange?.({ ...item, ...values });
  };
  const field = (key: keyof typeof values, label: string, area = false) => (
    <label style={{ display: "block", marginBottom: 10 }}>
      <span style={{ display: "block", color: "#646970", marginBottom: 2 }}>{label}</span>
      {area ? (
        <textarea rows={2} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} onBlur={save} style={{ width: "100%" }} />
      ) : (
        <input type="text" value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} onBlur={save} style={{ width: "100%" }} />
      )}
    </label>
  );

  return (
    <div>
      <h3 style={{ textTransform: "uppercase", fontSize: 12, fontWeight: 600, color: "#646970", margin: "0 0 10px" }}>Attachment Details</h3>
      {item.mimeType.startsWith("image/") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt="" style={{ maxWidth: 120, maxHeight: 120, float: "left", marginRight: 10 }} />
      )}
      <div style={{ fontSize: 12, lineHeight: 1.5 }}>
        <strong style={{ wordBreak: "break-all" }}>{item.filename}</strong>
        <div>{new Date(item.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
        {item.size && <div>{Math.round(item.size / 1024)} KB</div>}
        {item.width && <div>{item.width} by {item.height} pixels</div>}
      </div>
      <div style={{ clear: "both", paddingTop: 10, borderTop: "1px solid #dcdcde", marginTop: 10 }}>
        {field("alt", "Alternative Text")}
        <p style={{ fontSize: 12, color: "#646970", marginTop: -6 }}>Describe the purpose of the image. Include the focus keyword where it fits naturally.</p>
        {field("title", "Title")}
        {field("caption", "Caption", true)}
        <label style={{ display: "block" }}>
          <span style={{ display: "block", color: "#646970", marginBottom: 2 }}>File URL</span>
          <input type="text" readOnly value={item.url} style={{ width: "100%" }} onFocus={(e) => e.target.select()} />
        </label>
        {status && <p style={{ fontSize: 12, color: "#646970" }}>{status === "saving" ? "Saving…" : "Saved."}</p>}
      </div>
    </div>
  );
}

export function MediaModal({
  title,
  button,
  onClose,
  onSelect,
}: {
  title: string;
  button: string;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
}) {
  const [tab, setTab] = useState<"upload" | "library">("library");
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => listMedia(search).then((r) => live && setItems(r)), search ? 250 : 0);
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

  return (
    <>
      <div className="media-modal-backdrop" onClick={onClose} />
      <div className="media-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid #dcdcde" }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: "14px 0" }}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" style={{ fontSize: 26, color: "#646970", width: 40, height: 40 }}>×</button>
        </div>
        <div className="nav-tab-wrapper" style={{ padding: "10px 16px 0", marginBottom: 0 }}>
          <button type="button" className={`nav-tab ${tab === "upload" ? "active" : ""}`} onClick={() => setTab("upload")}>Upload files</button>
          <button type="button" className={`nav-tab ${tab === "library" ? "active" : ""}`} onClick={() => setTab("library")}>Media Library</button>
        </div>
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {tab === "upload" ? (
              <Uploader
                onUploaded={(added) => {
                  setItems((cur) => [...added, ...(cur ?? [])]);
                  setSelected(added[0]);
                  setTab("library");
                }}
              />
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <input type="search" placeholder="Search media" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search media" />
                </div>
                {!items ? (
                  <p>Loading…</p>
                ) : items.length === 0 ? (
                  <p>No media files found.</p>
                ) : (
                  <div className="media-grid">
                    {items.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`attachment ${selected?.id === m.id ? "selected" : ""}`}
                        onClick={() => setSelected(m)}
                        title={m.filename}
                      >
                        {m.mimeType.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.url} alt={m.alt ?? ""} loading="lazy" />
                        ) : (
                          <span style={{ padding: 8, fontSize: 12 }}>{m.filename}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {selected && tab === "library" && (
            <aside style={{ width: 280, borderLeft: "1px solid #dcdcde", background: "#f6f7f7", padding: 16, overflowY: "auto" }}>
              <AttachmentDetails key={selected.id} item={selected} onChange={(u) => {
                setSelected(u);
                setItems((cur) => cur?.map((x) => (x.id === u.id ? u : x)) ?? null);
              }} />
            </aside>
          )}
        </div>
        <div style={{ borderTop: "1px solid #dcdcde", padding: "12px 16px", display: "flex", justifyContent: "flex-end" }}>
          <button type="button" className="wp-btn wp-btn-primary wp-btn-large" disabled={!selected} onClick={() => selected && onSelect(selected)}>
            {button}
          </button>
        </div>
      </div>
    </>
  );
}
