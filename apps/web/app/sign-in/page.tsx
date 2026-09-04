import type { Metadata } from "next";

import AuthForm from "@/app/components/auth-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول — المساعد القانوني المصري",
};

export default function SignInPage() {
  return (
    <main className="auth-shell">
      <AuthForm />
    </main>
  );
}
