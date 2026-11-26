"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { quickDraft, type SaveState } from "../actions";

export function QuickDraft() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<SaveState, FormData>(quickDraft, {});
  useEffect(() => {
    if (state.saved) {
      form.current?.reset();
      router.refresh();
    }
  }, [state.savedAt, state.saved, router]);
  return (
    <form ref={form} action={action} style={{ display: "grid", gap: 10 }}>
      <label>
        <span style={{ display: "block", marginBottom: 4 }}>Title</span>
        <input type="text" name="title" style={{ width: "100%" }} />
      </label>
      <label>
        <span style={{ display: "block", marginBottom: 4 }}>Content</span>
        <textarea name="content" rows={3} placeholder="What’s on your mind?" style={{ width: "100%" }} />
      </label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button className="wp-btn wp-btn-primary" disabled={pending}>Save Draft</button>
        {state.error && <span style={{ color: "#d63638" }}>{state.error}</span>}
        {state.saved && <span style={{ color: "#00a32a" }}>{state.message}</span>}
      </div>
    </form>
  );
}
