"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export function AccountLink() {
  const { data } = useSession();
  if (!data) {
    return (
      <Link href="/sign-in/" className="hover:text-white">
        Sign in
      </Link>
    );
  }
  const isAdmin = (data.user as { role?: string }).role === "admin";
  return (
    <Link href={isAdmin ? "/admin/" : "/account/"} className="hover:text-white">
      {isAdmin ? "Admin" : "Your account"}
    </Link>
  );
}
