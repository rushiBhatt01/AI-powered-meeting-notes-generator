import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-zinc-950 font-sans">
      {/* Background Glow */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 10.1%, 60.2% 21.8%, 54.1% 25.6%, 50.1% 30.5%, 20.9% 37.2%, 8.1% 54.7%, 0.1% 81.9%, 17.9% 93.3%, 24.1% 95.5%, 75.2% 98.4%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <a href="#" className="inline-flex space-x-6">
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-semibold leading-6 text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                v1.0.0 Zero-Cost Intelligence
              </span>
            </a>
          </div>
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            AI Meeting Notes Generator
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-300">
            The Zero-Cost Intelligence Portal for your Meetings. Transform raw transcripts into structured action items, decisions, and summaries using Gemini 2.5 Flash.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Link
              href="/dashboard"
              className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 transition-all"
            >
              Get Started
            </Link>
            <Link href="/dashboard/new" className="text-sm font-semibold leading-6 text-white hover:text-zinc-300 transition-colors">
              Create Meeting <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
