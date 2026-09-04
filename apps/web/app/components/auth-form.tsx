"use client";

import { useActionState, useState, type FormEvent } from "react";

import { signIn, signUp, type AuthState } from "@/app/actions/auth";

type Mode = "signin" | "signup";

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");

  const [signInState, doSignIn, isSigningIn] = useActionState<AuthState, FormData>(
    signIn,
    null,
  );
  const [signUpState, doSignUp, isSigningUp] = useActionState<AuthState, FormData>(
    signUp,
    null,
  );

  function guardEmptyFields(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      "input, select",
    );

    for (const field of fields) {
      if (!field.value.trim()) {
        event.preventDefault();
        return;
      }
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={`auth-tab ${mode === "signin" ? "active" : ""}`}
          onClick={() => setMode("signin")}
        >
          تسجيل الدخول
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`auth-tab ${mode === "signup" ? "active" : ""}`}
          onClick={() => setMode("signup")}
        >
          إنشاء حساب
        </button>
      </div>

      {mode === "signin" ? (
        <form action={doSignIn} onSubmit={guardEmptyFields} noValidate={false}>
          {signInState?.error && (
            <p className="auth-error" role="alert">
              {signInState.error}
            </p>
          )}

          <label className="auth-field">
            البريد الإلكتروني
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="auth-input"
            />
          </label>

          <label className="auth-field">
            كلمة المرور
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="auth-input"
            />
          </label>

          <button type="submit" className="auth-submit" disabled={isSigningIn}>
            {isSigningIn ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>
      ) : (
        <form action={doSignUp} onSubmit={guardEmptyFields} noValidate={false}>
          {signUpState?.error && (
            <p className="auth-error" role="alert">
              {signUpState.error}
            </p>
          )}

          <label className="auth-field">
            الاسم
            <input
              type="text"
              name="name"
              required
              autoComplete="name"
              className="auth-input"
            />
          </label>

          <label className="auth-field">
            البريد الإلكتروني
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="auth-input"
            />
          </label>

          <label className="auth-field">
            كلمة المرور
            <input
              type="password"
              name="password"
              required
              autoComplete="new-password"
              className="auth-input"
            />
          </label>

          <label className="auth-field">
            الدور
            <select name="role" required defaultValue="" className="auth-select">
              <option value="" disabled>
                اختر الدور
              </option>
              <option value="USER">مستخدم</option>
              <option value="ADMIN">مسؤول</option>
            </select>
          </label>

          <button type="submit" className="auth-submit" disabled={isSigningUp}>
            {isSigningUp ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
          </button>
        </form>
      )}
    </div>
  );
}
