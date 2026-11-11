"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/account/";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const res =
      mode === "sign-in"
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name: String(form.get("name")) });
    setPending(false);
    if (res.error) {
      setError(res.error.message ?? "Something went wrong. Please try again.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  const input =
    "mt-1.5 w-full rounded-xl border border-granite-200 bg-white px-4 py-2.5 outline-none focus:border-moss-500 focus:ring-2 focus:ring-moss-100";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "sign-up" && (
        <label className="block text-sm font-medium">
          Name
          <input name="name" required autoComplete="name" className={input} />
        </label>
      )}
      <label className="block text-sm font-medium">
        Email
        <input name="email" type="email" required autoComplete="email" className={input} />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={mode === "sign-up" ? 10 : undefined}
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          className={input}
        />
        {mode === "sign-up" && <span className="mt-1 block text-xs text-granite-500">At least 10 characters.</span>}
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-full bg-moss-600 py-3 font-semibold text-white hover:bg-moss-700 disabled:opacity-60"
      >
        {pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
      </button>
      <p className="text-center text-sm text-granite-500">
        {mode === "sign-in" ? (
          <>
            New here?{" "}
            <Link href={`/sign-up/?next=${encodeURIComponent(next)}`} className="font-semibold text-moss-700">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/sign-in/?next=${encodeURIComponent(next)}`} className="font-semibold text-moss-700">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
