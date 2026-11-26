"use client";

import Link from "next/link";
import { useState } from "react";
import type { MediaItem } from "../media/actions";
import { Uploader } from "./media-modal";

export function UploadScreen() {
  const [done, setDone] = useState<MediaItem[]>([]);
  return (
    <div style={{ background: "#fff", padding: 20, border: "1px solid #c3c4c7" }}>
      <Uploader onUploaded={(items) => setDone((d) => [...items, ...d])} />
      {done.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
          {done.map((m) => (
            <li key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 8, borderBottom: "1px solid #f0f0f1" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt="" width={48} height={48} style={{ objectFit: "cover", width: 48, height: 48 }} />
              <span style={{ flex: 1 }}>{m.filename}</span>
              <Link href={`/admin/media/${m.id}/`}>Edit</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
