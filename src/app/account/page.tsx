import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in/?next=/account/");
  const isAdmin = (session.user as { role?: string }).role === "admin";
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Hi, {session.user.name}</h1>
      <p className="mt-2 text-granite-500">Signed in as {session.user.email}</p>
      <div className="mt-8 flex gap-3">
        {isAdmin && (
          <Link href="/admin/" className="rounded-full bg-moss-600 px-4 py-2 text-sm font-semibold text-white hover:bg-moss-700">
            Open admin
          </Link>
        )}
        <SignOutButton />
      </div>
    </div>
  );
}
