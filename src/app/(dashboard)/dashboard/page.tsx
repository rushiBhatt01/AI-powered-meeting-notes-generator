import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { eq, desc, ilike, or, and } from "drizzle-orm";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string }> = {
  queued: { label: "Queued", color: "bg-zinc-600 text-zinc-200" },
  processing: { label: "Processing", color: "bg-amber-500/20 text-amber-400" },
  completed: { label: "Ready", color: "bg-emerald-500/20 text-emerald-400" },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-400" },
  draft: { label: "Draft", color: "bg-zinc-600 text-zinc-300" },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await currentUser();
  const params = await searchParams;
  const query = params?.q ?? "";

  const ownerFilter = eq(meetings.user_id, user?.id ?? "");

  const whereClause = query
    ? and(
        ownerFilter,
        or(
          ilike(meetings.title, `%${query}%`),
          ilike(meetings.summary ?? "", `%${query}%`)
        )
      )
    : ownerFilter;

  const userMeetings = await db
    .select()
    .from(meetings)
    .where(whereClause)
    .orderBy(desc(meetings.meeting_date));

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="mt-2 text-zinc-400">
            Your intelligence portal is ready.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-400"
        >
          + New Meeting
        </Link>
      </div>

      {/* Search Bar */}
      <form className="mb-6">
        <input
          name="q"
          type="text"
          defaultValue={query}
          placeholder="Search meetings by title or summary..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
        />
      </form>

      {/* Meeting List */}
      {userMeetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/30 py-16">
          <span className="mb-3 text-4xl">📭</span>
          <h3 className="text-lg font-semibold text-zinc-300">
            {query ? "No results found" : "No meetings yet"}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {query
              ? `No meetings match "${query}". Try a different search.`
              : "Get started by creating your first meeting."}
          </p>
          {!query && (
            <Link
              href="/dashboard/new"
              className="mt-4 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-400"
            >
              Create Meeting
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {userMeetings.map((meeting) => {
            const status = statusConfig[meeting.status] ?? statusConfig.draft;
            return (
              <Link
                key={meeting.id}
                href={`/dashboard/meetings/${meeting.id}`}
                className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 px-5 py-4 transition-all hover:border-indigo-500/30 hover:bg-zinc-900/60"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {meeting.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(meeting.meeting_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`ml-4 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}
                >
                  {status.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
