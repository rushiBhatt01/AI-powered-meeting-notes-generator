"use client";

import { useState } from "react";
import type { Meeting, Imp } from "@/db/schema";
import { updateImp, deleteImp } from "@/app/actions/imp";
import { deleteMeeting } from "@/app/actions/meeting";
import CopyButton from "@/components/copy-button";
import ConfirmModal from "@/components/ui/confirm-modal";
import { formatImpsAsMarkdown } from "@/lib/clipboard-utils";
import { personaConfig, type Persona } from "@/lib/persona-utils";

interface Props {
  meeting: Meeting;
  imps: Imp[];
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    queued: "bg-zinc-600 text-zinc-200",
    processing: "bg-amber-500/20 text-amber-400",
    completed: "bg-emerald-500/20 text-emerald-400",
    failed: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${config[status] ?? config.queued}`}>
      {status === "completed" ? "Ready" : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ImpCard({
  imp,
  onDelete,
  themeClass,
}: {
  imp: Imp;
  onDelete: (id: number) => void;
  themeClass: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(imp.description);
  const [showSource, setShowSource] = useState(false);

  const handleSave = async () => {
    if (!editText.trim()) return;
    await updateImp(imp.id, editText);
    setIsEditing(false);
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        imp.is_low_confidence
          ? "border-amber-500/40 bg-amber-500/5"
          : themeClass
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="rounded-md bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-400"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditText(imp.description);
                    setIsEditing(false);
                  }}
                  className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-200">{imp.description}</p>
          )}

          {imp.owner_name && imp.owner_name !== "Unassigned" && (
            <span className="mt-1.5 inline-block rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400">
              @{imp.owner_name}
            </span>
          )}

          {imp.date_info && (
            <span className="ml-2 mt-1.5 inline-block text-xs text-zinc-500">
              📅 {imp.date_info}
            </span>
          )}

          {imp.is_low_confidence && (
            <span className="ml-2 mt-1.5 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
              ⚠ Review
            </span>
          )}
        </div>

        {!isEditing && (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-white"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(imp.id)}
              className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Source tooltip */}
      {imp.source_snippet && (
        <div className="mt-2">
          <button
            onClick={() => setShowSource(!showSource)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {showSource ? "Hide source ▾" : "Show source ▸"}
          </button>
          {showSource && (
            <blockquote className="mt-1.5 border-l-2 border-zinc-700 pl-3 text-xs italic text-zinc-500">
              &quot;{imp.source_snippet}&quot;
            </blockquote>
          )}
        </div>
      )}
    </div>
  );
}

export default function MeetingDetailClient({ meeting, imps: initialImps }: Props) {
  const [localImps, setLocalImps] = useState(initialImps);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [impToDelete, setImpToDelete] = useState<number | null>(null);
  const [persona, setPersona] = useState<Persona>("corporate");

  const summaryImps = localImps.filter((i) => i.type === "summary");
  const actionItems = localImps.filter((i) => i.type === "action_item");
  const decisions = localImps.filter((i) => i.type === "decision");
  const deadlines = localImps.filter((i) => i.type === "deadline");

  const pConfig = personaConfig[persona];

  const handleDeleteImp = (id: number) => {
    setImpToDelete(id);
  };

  const confirmDeleteImp = async () => {
    if (impToDelete === null) return;
    await deleteImp(impToDelete);
    setLocalImps((prev) => prev.filter((i) => i.id !== impToDelete));
    setImpToDelete(null);
  };

  const handleDeleteMeeting = async () => {
    await deleteMeeting(meeting.id);
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {meeting.title}
            </h1>
            <StatusBadge status={meeting.status} />
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            {new Date(meeting.meeting_date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Persona Toggle */}
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
            <button
              onClick={() => setPersona("corporate")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                persona === "corporate"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Corporate
            </button>
            <button
              onClick={() => setPersona("academic")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                persona === "academic"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Academic
            </button>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="rounded-md bg-red-600/20 px-3 py-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/30"
          >
            🗑 Delete
          </button>
        </div>
      </div>

      {/* Summary Section */}
      {summaryImps.length > 0 && (
        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              {pConfig.summaryHeader}
            </h2>
            <CopyButton
              text={formatImpsAsMarkdown("summary", summaryImps)}
            />
          </div>
          <p className="text-sm leading-relaxed text-zinc-200">
            {summaryImps[0].description}
          </p>
        </section>
      )}

      {/* Action Items */}
      {actionItems.length > 0 && (
        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              {pConfig.tasksHeader} ({actionItems.length})
            </h2>
            <CopyButton
              text={formatImpsAsMarkdown("action_item", actionItems)}
            />
          </div>
          <div className="space-y-2">
            {actionItems.map((imp) => (
              <ImpCard key={imp.id} imp={imp} onDelete={handleDeleteImp} themeClass={persona === "corporate" ? pConfig.highlightClass : "border-zinc-800 bg-zinc-900/30"} />
            ))}
          </div>
        </section>
      )}

      {/* Decisions */}
      {decisions.length > 0 && (
        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              {pConfig.decisionsHeader} ({decisions.length})
            </h2>
            <CopyButton
              text={formatImpsAsMarkdown("decision", decisions)}
            />
          </div>
          <div className="space-y-2">
            {decisions.map((imp) => (
              <ImpCard key={imp.id} imp={imp} onDelete={handleDeleteImp} themeClass={persona === "academic" ? pConfig.highlightClass : "border-zinc-800 bg-zinc-900/30"} />
            ))}
          </div>
        </section>
      )}

      {/* Deadlines */}
      {deadlines.length > 0 && (
        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              {pConfig.datesHeader} ({deadlines.length})
            </h2>
            <CopyButton
              text={formatImpsAsMarkdown("deadline", deadlines)}
            />
          </div>
          <div className="space-y-2">
            {deadlines.map((imp) => (
              <ImpCard key={imp.id} imp={imp} onDelete={handleDeleteImp} themeClass="border-zinc-800 bg-zinc-900/30" />
            ))}
          </div>
        </section>
      )}

      {/* No results */}
      {localImps.length === 0 && meeting.status === "completed" && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/30 py-16">
          <span className="mb-3 text-4xl">🔍</span>
          <h3 className="text-lg font-semibold text-zinc-300">
            No intelligence extracted
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            The AI could not identify actionable items in this transcript.
          </p>
        </div>
      )}

      {/* Processing state */}
      {(meeting.status === "queued" || meeting.status === "processing") && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/30 py-16">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-indigo-500" />
          <h3 className="text-lg font-semibold text-zinc-300">
            Processing your meeting...
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            The Imp is analyzing your transcript. This may take a moment.
          </p>
        </div>
      )}

      {/* Modals */}
      {impToDelete !== null && (
        <ConfirmModal
          title="Delete Extraction"
          message="Are you sure you want to remove this item? This cannot be undone."
          onConfirm={confirmDeleteImp}
          onCancel={() => setImpToDelete(null)}
        />
      )}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete Meeting"
          message="This will permanently delete the meeting and all extracted intelligence. This cannot be undone."
          confirmLabel="Delete Meeting"
          onConfirm={handleDeleteMeeting}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
