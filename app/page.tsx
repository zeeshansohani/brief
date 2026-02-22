"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error ?? "Something went wrong.");
        return;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-16 sm:px-8 sm:pt-24">
        {/* Hero */}
        <header className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Markets move on data. Be ready.
          </h1>
          <p className="mt-4 text-lg text-slate-300 sm:text-xl">
            Brief delivers a daily AI-powered PDF digest of the most important
            economic data and market news — straight to your inbox, every
            morning.
          </p>
        </header>

        {/* Signup form */}
        <section className="mt-10">
          {status === "success" ? (
            <p className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-center text-blue-200">
              You&apos;re subscribed. Your first Brief arrives tomorrow morning.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={status === "loading"}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-80"
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="shrink-0 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                {status === "loading" ? "Subscribing…" : "Subscribe for free"}
              </button>
            </form>
          )}
          {status === "error" && errorMessage && (
            <p className="mt-2 text-center text-sm text-red-400">
              {errorMessage}
            </p>
          )}
        </section>

        {/* Feature cards */}
        <section className="mt-20 grid gap-6 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Real Economic Data
            </h2>
            <p className="mt-2 text-slate-300">
              Sourced directly from the Federal Reserve.
            </p>
          </article>
          <article className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              AI Insights
            </h2>
            <p className="mt-2 text-slate-300">
              Plain-English explanations of what the numbers mean.
            </p>
          </article>
          <article className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              PDF Delivered Daily
            </h2>
            <p className="mt-2 text-slate-300">
              A clean report in your inbox every morning.
            </p>
          </article>
        </section>

        {/* PDF preview placeholder */}
        <section className="mt-20">
          <p className="mb-3 text-center text-sm uppercase tracking-wider text-slate-500">
            Sample report
          </p>
          <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-8 text-center">
            <div className="mx-auto max-w-sm rounded-lg border border-slate-600 bg-slate-800/60 p-12">
              <p className="text-slate-500">
                PDF preview will appear here
                <br />
                <span className="text-xs">(screenshot or static mock)</span>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        Brief — Your daily economic intelligence
      </footer>
    </div>
  );
}
