import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { meetings, imps } from "@/db/schema";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import Link from "next/link";

const statusConfig: Record<
  string,
  { label: string; toneClass: string; dotClass: string }
> = {
  queued: {
    label: "Queued",
    toneClass: "border border-zinc-700 bg-zinc-800 text-zinc-300",
    dotClass: "bg-zinc-400",
  },
  processing: {
    label: "Processing",
    toneClass: "border border-amber-400/30 bg-amber-500/10 text-amber-300",
    dotClass: "bg-amber-300",
  },
  completed: {
    label: "Ready",
    toneClass: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    dotClass: "bg-emerald-300",
  },
  failed: {
    label: "Failed",
    toneClass: "border border-red-400/30 bg-red-500/10 text-red-300",
    dotClass: "bg-red-300",
  },
  draft: {
    label: "Draft",
    toneClass: "border border-zinc-700 bg-zinc-800 text-zinc-300",
    dotClass: "bg-zinc-400",
  },
};

type MeetingRecord = typeof meetings.$inferSelect;

type MeetingCounts = {
  actionItems: number;
  decisions: number;
  deadlines: number;
};

function summarizeMeeting(meeting: MeetingRecord): string {
  const source = (meeting.summary ?? meeting.raw_transcript ?? "").replace(
    /\s+/g,
    " "
  );

  if (!source.trim()) {
    return "No summary available yet. Open this note to review the transcript details.";
  }

  return source.length > 170 ? `${source.slice(0, 167)}...` : source;
}

function formatDateLabel(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MetricPill({
  label,
  value,
  toneClass,
}: {
  label: string;
  value: number;
  toneClass: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${toneClass}`}
    >
      <span className="font-semibold">{value}</span>
      <span className="text-zinc-400">{label}</span>
    </span>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await currentUser();
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";

  const ownerFilter = eq(meetings.user_id, user?.id ?? "");

  const whereClause = query
    ? and(
        ownerFilter,
        or(ilike(meetings.title, `%${query}%`), ilike(meetings.summary, `%${query}%`))
      )
    : ownerFilter;

  const userMeetings = await db
    .select()
    .from(meetings)
    .where(whereClause)
    .orderBy(desc(meetings.meeting_date));

  const meetingIds = userMeetings.map((meeting) => meeting.id);
  const meetingImps = meetingIds.length
    ? await db
        .select({
          meetingId: imps.meeting_id,
          type: imps.type,
        })
        .from(imps)
        .where(inArray(imps.meeting_id, meetingIds))
    : [];

  const impCountsByMeeting = new Map<number, MeetingCounts>();
  let totalActionItems = 0;

  for (const imp of meetingImps) {
    const counts = impCountsByMeeting.get(imp.meetingId) ?? {
      actionItems: 0,
      decisions: 0,
      deadlines: 0,
    };

    if (imp.type === "action_item") {
      counts.actionItems += 1;
      totalActionItems += 1;
    } else if (imp.type === "decision") {
      counts.decisions += 1;
    } else if (imp.type === "deadline") {
      counts.deadlines += 1;
    }

    impCountsByMeeting.set(imp.meetingId, counts);
  }

  const completedMeetings = userMeetings.filter(
    (meeting) => meeting.status === "completed"
  ).length;
  const processingMeetings = userMeetings.filter(
    (meeting) => meeting.status === "queued" || meeting.status === "processing"
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
            Meeting notes dashboard
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="mt-2 text-zinc-400 sm:text-base">
            Review structured notes, monitor processing, and open each meeting with
            one click.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(99,102,241,0.35)] transition-colors hover:bg-indigo-400 sm:w-auto"
        >
          + New Meeting Note
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-zinc-800/80 bg-zinc-900/45 p-4">
          <p className="text-xs text-zinc-500">Total meetings</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {userMeetings.length}
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-800/80 bg-zinc-900/45 p-4">
          <p className="text-xs text-zinc-500">Ready notes</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {completedMeetings}
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-800/80 bg-zinc-900/45 p-4">
          <p className="text-xs text-zinc-500">In processing</p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">
            {processingMeetings}
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-800/80 bg-zinc-900/45 p-4">
          <p className="text-xs text-zinc-500">Action items captured</p>
          <p className="mt-2 text-2xl font-semibold text-indigo-300">
            {totalActionItems}
          </p>
        </article>
      </section>

      <form className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
        >
          <path
            d="M21 21l-4.25-4.25M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <input
          name="q"
          type="text"
          defaultValue={query}
          placeholder="Search by title or meeting summary..."
          className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-900/60 py-3 pl-11 pr-4 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-indigo-400/40 focus:outline-none focus:ring-1 focus:ring-indigo-400/40"
        />
      </form>

      {userMeetings.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-12 text-center">
          <h3 className="text-xl font-semibold text-zinc-200">
            {query ? "No matching meeting notes" : "No meeting notes yet"}
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            {query
              ? `No saved notes include "${query}". Try a different keyword.`
              : "Create your first meeting note to generate structured summaries and action plans."}
          </p>
          {!query && (
            <Link
              href="/dashboard/new"
              className="mt-5 inline-flex rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
            >
              Create First Meeting
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {userMeetings.map((meeting) => {
            const status = statusConfig[meeting.status] ?? statusConfig.draft;
            const counts = impCountsByMeeting.get(meeting.id) ?? {
              actionItems: 0,
              decisions: 0,
              deadlines: 0,
            };

            return (
              <Link
                key={meeting.id}
                href={`/dashboard/meetings/${meeting.id}`}
                className="group flex h-full flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/45 p-5 transition-colors hover:border-indigo-400/35 hover:bg-zinc-900/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">
                      {formatDateLabel(meeting.meeting_date)}
                    </p>
                    <h3 className="mt-2 truncate text-base font-semibold text-zinc-100 transition-colors group-hover:text-indigo-200">
                      {meeting.title}
                    </h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.toneClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                    {status.label}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  {summarizeMeeting(meeting)}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <MetricPill
                    label="actions"
                    value={counts.actionItems}
                    toneClass="border border-indigo-500/25 bg-indigo-500/10 text-indigo-200"
                  />
                  <MetricPill
                    label="decisions"
                    value={counts.decisions}
                    toneClass="border border-cyan-500/25 bg-cyan-500/10 text-cyan-200"
                  />
                  <MetricPill
                    label="deadlines"
                    value={counts.deadlines}
                    toneClass="border border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-200"
                  />
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-4 text-xs text-zinc-500">
                  <span>Updated {formatDateLabel(meeting.updated_at)}</span>
                  <span className="font-medium text-indigo-300 transition-colors group-hover:text-indigo-200">
                    Open notes →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
