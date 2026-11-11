"use client";

import { useActionState } from "react";
import { savePost, type SaveState } from "./actions";

type PostValues = {
  id?: number;
  title: string;
  slug: string;
  status: string;
  lang: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  author: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export function PostForm({
  post,
  categories,
  selected,
  justCreated,
}: {
  post: PostValues;
  categories: { id: number; name: string }[];
  selected: number[];
  justCreated?: boolean;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(savePost, justCreated ? { saved: true } : {});
  const field = "mt-1.5 w-full rounded-xl border border-granite-200 bg-white px-3.5 py-2.5 outline-none focus:border-moss-500";
  const label = "block text-sm font-medium";

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      {post.id && <input type="hidden" name="id" value={post.id} />}
      <div className="space-y-5">
        <label className={label}>
          Title
          <input name="title" defaultValue={post.title} required className={`${field} text-lg font-semibold`} />
        </label>
        <label className={label}>
          URL slug
          <input name="slug" defaultValue={post.slug} className={field} placeholder="Leave blank to build it from the title" />
        </label>
        <label className={label}>
          Excerpt
          <textarea name="excerpt" defaultValue={post.excerpt ?? ""} rows={3} className={field} />
        </label>
        <label className={label}>
          Content (HTML)
          <textarea name="content" defaultValue={post.content} rows={28} className={`${field} font-mono text-xs leading-relaxed`} />
          <span className="mt-1 block text-xs text-granite-500">Scripts, styles and unknown tags are stripped when you save.</span>
        </label>
      </div>

      <div className="space-y-5">
        <div className="space-y-3 rounded-2xl border border-granite-100 bg-white p-4">
          <label className={label}>
            Status
            <select name="status" defaultValue={post.status} className={field}>
              <option value="publish">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <label className={label}>
            Language
            <select name="lang" defaultValue={post.lang} className={field}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </label>
          <button
            disabled={pending}
            className="w-full rounded-full bg-moss-600 py-2.5 font-semibold text-white hover:bg-moss-700 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          {state.error && <p className="text-sm text-red-700">{state.error}</p>}
          {state.saved && !pending && <p className="text-sm text-moss-700">Saved.</p>}
        </div>

        <fieldset className="rounded-2xl border border-granite-100 bg-white p-4">
          <legend className="px-1 text-sm font-medium">Categories</legend>
          {categories.map((c) => (
            <label key={c.id} className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="categories" value={c.id} defaultChecked={selected.includes(c.id)} />
              {c.name}
            </label>
          ))}
        </fieldset>

        <div className="space-y-3 rounded-2xl border border-granite-100 bg-white p-4">
          <label className={label}>
            Cover image path
            <input name="coverImage" defaultValue={post.coverImage ?? ""} className={field} placeholder="/wp-content/uploads/…" />
          </label>
          <label className={label}>
            Author
            <input name="author" defaultValue={post.author ?? ""} className={field} />
          </label>
          <label className={label}>
            SEO title
            <input name="seoTitle" defaultValue={post.seoTitle ?? ""} className={field} />
          </label>
          <label className={label}>
            SEO description
            <textarea name="seoDescription" defaultValue={post.seoDescription ?? ""} rows={3} className={field} />
          </label>
        </div>
      </div>
    </form>
  );
}
