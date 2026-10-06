"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setAuthError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setAuthError("Invalid email or password.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setAuthError("Unable to sign in right now. Please try again.");
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="simple-mark">
            <Users />
          </span>
          <span>Our chores</span>
        </div>
        <p className="simple-kicker">Shared household</p>
        <h1>
          {authMode === "login"
            ? "Welcome back"
            : "Create your household login"}
        </h1>
        <p className="auth-subtitle">
          {authMode === "login"
            ? "Sign in to see what needs doing."
            : "Keep everyone on the same page."}
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            autoComplete={
              authMode === "login" ? "current-password" : "new-password"
            }
            required
          />
          {authError && (
            <p className="auth-error" role="alert">
              {authError}
            </p>
          )}
          <button className="simple-primary auth-submit" type="submit">
            {authMode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
        <p className="auth-switch">
          {authMode === "login"
            ? "New to the household?"
            : "Already have an account?"}
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setAuthError("");
            }}
          >
            {authMode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
        {authMode === "login" && (
          <p className="auth-demo">Demo: amirul@gmail.com · 123</p>
        )}
      </div>
    </main>
  );
}
