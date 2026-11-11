"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/");
        router.refresh();
      }}
      className="rounded-full border border-granite-200 px-4 py-2 text-sm font-semibold hover:bg-granite-100"
    >
      Sign out
    </button>
  );
}
