"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TranscriptInput from "@/components/transcript-input";
import FileDropzone from "@/components/file-dropzone";

const MAX_TRANSCRIPT_SUBMIT_BYTES = Math.floor(3.5 * 1024 * 1024);

export default function NewMeetingPage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFileExtract = (text: string) => {
    setSubmitError(null);
    setTranscript(text);
  };

  const handleSubmit = async (finalTranscript: string) => {
    setSubmitError(null);

    const transcriptBytes = new Blob([finalTranscript]).size;
    if (transcriptBytes > MAX_TRANSCRIPT_SUBMIT_BYTES) {
      setSubmitError(
        `Transcript is too large (${(transcriptBytes / 1024 / 1024).toFixed(1)}MB). Reduce it to 3.5MB or less before processing.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title,
          meetingDate,
          rawTranscript: finalTranscript,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Failed to create meeting.");
        }

        const errorText = await response.text();
        throw new Error(errorText || "Failed to create meeting.");
      }

      const payload = (await response.json()) as { meetingId?: number };
      if (typeof payload.meetingId !== "number") {
        throw new Error("Meeting was created but no meeting ID was returned.");
      }

      router.push(`/dashboard/meetings/${payload.meetingId}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to create meeting:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to create meeting. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          New Meeting
        </h1>
        <p className="mt-2 text-zinc-400">
          Add meeting details, paste your transcript or upload a file, then
          process.
        </p>
      </div>

      {/* Metadata Section */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 mb-6">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">
          Meeting Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="meeting-title"
              className="block text-xs font-medium text-zinc-400 mb-1.5"
            >
              Meeting Title
            </label>
            <input
              id="meeting-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Meeting"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label
              htmlFor="meeting-date"
              className="block text-xs font-medium text-zinc-400 mb-1.5"
            >
              Meeting Date
            </label>
            <input
              id="meeting-date"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 transition-colors focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 mb-6">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">Upload File</h2>
        <FileDropzone onExtract={handleFileExtract} />
      </div>

      {/* Transcript Paste Section */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <TranscriptInput
          value={transcript}
          onChange={setTranscript}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
        {submitError && (
          <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {submitError}
          </p>
        )}
      </div>
    </>
  );
}
