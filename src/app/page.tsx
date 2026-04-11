import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

const noteLayers = [
  {
    label: "Meeting Summary",
    title: "Roadmap alignment for Q2 launch",
    detail:
      "Team aligned on release priorities, risk blockers, and customer rollout timing.",
  },
  {
    label: "Action Items",
    title: "8 tasks assigned",
    detail: "Owners and due dates auto-captured from the transcript.",
  },
  {
    label: "Key Decisions",
    title: "Pricing model approved",
    detail: "Final decision logged with source excerpt for traceability.",
  },
  {
    label: "Deadlines",
    title: "Launch prep review on Apr 28",
    detail: "Upcoming milestones surfaced in one glance.",
  },
] as const;

const productHighlights = [
  {
    title: "Structured output",
    description:
      "Get clear summaries, decisions, tasks, and deadlines from every conversation.",
  },
  {
    title: "Traceable intelligence",
    description:
      "Each insight keeps source context so teams can verify what was actually said.",
  },
  {
    title: "Fast workflow",
    description:
      "Upload transcript or audio, process instantly, and share polished notes in minutes.",
  },
] as const;

const quickStats = [
  { label: "Minutes to first draft", value: "< 10 min" },
  { label: "Supported meeting uploads", value: "Text + Audio" },
  { label: "Notes format", value: "Summary + Actions" },
] as const;

export default async function LandingPage() {
  const user = await currentUser();
  const isSignedIn = Boolean(user);

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-black text-zinc-100">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[130px]" />
      </div>

      <main className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-20 pt-8 sm:px-8 lg:px-10 lg:pt-12">
        <header className="flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-sm font-bold text-indigo-200 ring-1 ring-indigo-400/30">
              AI
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-100">Meeting Notes Studio</p>
            </div>
          </div>
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-indigo-400/50 hover:text-white"
            >
              Open Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="rounded-lg border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-indigo-400/50 hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
              >
                Sign up
              </Link>
            </div>
          )}
        </header>

        <section className="mt-12 grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
              Meeting notes workflow
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Turn every meeting into a structured brief your team can act on.
            </h1>
            <p className="mt-6 text-base leading-7 text-zinc-300 sm:text-lg">
              Upload transcript or audio and get organized notes with summaries,
              decisions, action owners, and deadlines.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard/new"
                    className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(99,102,241,0.35)] transition-colors hover:bg-indigo-400"
                  >
                    Create Meeting Note
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
                  >
                    View Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(99,102,241,0.35)] transition-colors hover:bg-indigo-400"
                  >
                    Sign up
                  </Link>
                  <Link
                    href="/sign-in"
                    className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/45 px-4 py-3"
                >
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto h-[430px] w-full max-w-xl [perspective:1800px]">
            <div
              className="absolute inset-0 rounded-[2rem] border border-zinc-800/80 bg-zinc-950/70 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.7)] [transform-style:preserve-3d] sm:p-5"
              style={{ transform: "rotateY(-15deg) rotateX(9deg)" }}
            >
              <div className="relative h-full overflow-hidden rounded-[1.6rem] border border-zinc-800/80 bg-zinc-900/70 p-4 sm:p-5">
                <div className="absolute -right-16 -top-14 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="absolute -bottom-16 left-8 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl" />
                {noteLayers.map((layer, index) => (
                  <article
                    key={layer.label}
                    className="absolute left-4 right-4 rounded-2xl border border-zinc-700/80 bg-black/65 p-3 shadow-[0_15px_40px_rgba(0,0,0,0.45)] sm:left-5 sm:right-5 sm:p-4"
                    style={{
                      top: `${56 + index * 74}px`,
                      transform: `translateX(${index * 14}px) translateZ(${
                        (noteLayers.length - index) * 24
                      }px)`,
                      zIndex: noteLayers.length - index,
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-200/90">
                      {layer.label}
                    </p>
                    <h3 className="mt-2 text-sm font-semibold text-zinc-100 sm:text-base">
                      {layer.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      {layer.detail}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {productHighlights.map((highlight) => (
            <article
              key={highlight.title}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5"
            >
              <h2 className="text-sm font-semibold text-zinc-100">
                {highlight.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {highlight.description}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
