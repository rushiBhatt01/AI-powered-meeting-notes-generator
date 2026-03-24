"use client";

import { useState } from "react";
import TranscriptInput from "@/components/transcript-input";
import FileDropzone from "@/components/file-dropzone";
import { createMeeting } from "@/app/actions/meeting";

export default function NewMeetingPage() {
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileExtract = (text: string) => {
    setTranscript(text);
  };

  const handleSubmit = async (finalTranscript: string) => {
    setIsSubmitting(true);
    try {
      await createMeeting({
        title,
        meetingDate,
        rawTranscript: finalTranscript,
      });
    } catch (error) {
      console.error("Failed to create meeting:", error);
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
      </div>
    </>
  );
}
