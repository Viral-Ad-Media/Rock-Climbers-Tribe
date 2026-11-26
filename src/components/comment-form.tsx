"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitComment, type CommentState } from "@/app/(site)/comment-actions";

export function CommentForm({ postId, es, requireNameEmail }: { postId: number; es: boolean; requireNameEmail: boolean }) {
  const [state, action, pending] = useActionState<CommentState, FormData>(submitComment, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);
  const input = "mt-1.5 w-full rounded-xl border border-granite-200 bg-white px-3.5 py-2.5 outline-none focus:border-moss-500";
  return (
    <form ref={form} action={action} className="mt-8 space-y-4 rounded-2xl border border-granite-100 bg-granite-50 p-6">
      <h3 className="font-display text-xl font-bold">{es ? "Deja un comentario" : "Leave a comment"}</h3>
      <p className="text-sm text-granite-500">
        {es ? "Tu correo no se publicará." : "Your email address will not be published."}
        {requireNameEmail && (es ? " Los campos obligatorios están marcados con *" : " Required fields are marked *")}
      </p>
      <input type="hidden" name="postId" value={postId} />
      {/* Honeypot: real people never see or fill this */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
        <label>
          Website URL
          <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="block text-sm font-medium">
        {es ? "Comentario" : "Comment"} *
        <textarea name="content" required rows={5} maxLength={5000} className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium">
          {es ? "Nombre" : "Name"} {requireNameEmail && "*"}
          <input name="authorName" required={requireNameEmail} maxLength={100} autoComplete="name" className={input} />
        </label>
        <label className="block text-sm font-medium">
          Email {requireNameEmail && "*"}
          <input name="authorEmail" type="email" required={requireNameEmail} maxLength={200} autoComplete="email" className={input} />
        </label>
        <label className="block text-sm font-medium">
          {es ? "Web" : "Website"}
          <input name="authorUrl" type="url" maxLength={200} autoComplete="url" className={input} />
        </label>
      </div>
      <button disabled={pending} className="rounded-full bg-moss-600 px-6 py-2.5 font-semibold text-white hover:bg-moss-700 disabled:opacity-60">
        {pending ? (es ? "Enviando…" : "Posting…") : es ? "Publicar comentario" : "Post Comment"}
      </button>
      {state.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
      {state.ok && <p className="text-sm text-moss-700" role="status">{state.message}</p>}
    </form>
  );
}
