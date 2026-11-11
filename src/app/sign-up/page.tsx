import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create your account", robots: { index: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Create your account</h1>
      <div className="mt-8 rounded-2xl border border-granite-100 bg-white p-6 shadow-sm">
        <Suspense>
          <AuthForm mode="sign-up" />
        </Suspense>
      </div>
    </div>
  );
}
