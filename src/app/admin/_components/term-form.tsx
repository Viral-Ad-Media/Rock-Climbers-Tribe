"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { saveTerm, type SaveState } from "../actions";

export function TermForm({
  taxonomy,
  term,
}: {
  taxonomy: "category" | "tag";
  term?: { id: number; name: string; slug: string; description: string | null };
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<SaveState, FormData>(saveTerm.bind(null, taxonomy), {});
  const noun = taxonomy === "category" ? "Category" : "Tag";
  useEffect(() => {
    if (!state.saved) return;
    if (term) router.push(taxonomy === "category" ? "/admin/categories/?message=Category%20updated." : "/admin/tags/?message=Tag%20updated.");
    else {
      form.current?.reset();
      router.refresh();
    }
  }, [state.savedAt, state.saved, term, taxonomy, router]);

  return (
    <form ref={form} action={action} style={{ display: "grid", gap: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{term ? `Edit ${noun}` : `Add New ${noun}`}</h2>
      {state.error && <div className="wp-notice error"><p>{state.error}</p></div>}
      {state.saved && !term && <div className="wp-notice"><p>{state.message}</p></div>}
      {term && <input type="hidden" name="id" value={term.id} />}
      <label>
        <span style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Name</span>
        <input type="text" name="name" defaultValue={term?.name} required style={{ width: "100%" }} />
        <span style={{ fontSize: 12, color: "#646970" }}>The name is how it appears on your site.</span>
      </label>
      <label>
        <span style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Slug</span>
        <input type="text" name="slug" defaultValue={term?.slug} style={{ width: "100%" }} />
        <span style={{ fontSize: 12, color: "#646970" }}>The “slug” is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens.</span>
      </label>
      <label>
        <span style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Description</span>
        <textarea name="description" rows={5} defaultValue={term?.description ?? ""} style={{ width: "100%" }} />
        <span style={{ fontSize: 12, color: "#646970" }}>Used as the meta description on the {noun.toLowerCase()} archive page.</span>
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="wp-btn wp-btn-primary" disabled={pending}>{term ? "Update" : `Add New ${noun}`}</button>
        {term && <a className="wp-btn" href={taxonomy === "category" ? "/admin/categories/" : "/admin/tags/"}>Cancel</a>}
      </div>
    </form>
  );
}
