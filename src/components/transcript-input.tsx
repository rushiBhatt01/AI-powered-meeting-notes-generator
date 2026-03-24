"use client";

interface TranscriptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (transcript: string) => void;
  isSubmitting?: boolean;
}

export default function TranscriptInput({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
}: TranscriptInputProps) {
  const trimmed = value.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = value.length;
  const isValid = trimmed.length > 0;

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onChange(text);
    } catch {
      // Clipboard access denied — fail silently
    }
  };

  const handleSubmit = () => {
    if (isValid && onSubmit) {
      onSubmit(trimmed);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="transcript-input"
          className="text-sm font-medium text-zinc-300"
        >
          Transcript Content
        </label>
        <button
          type="button"
          onClick={handlePasteFromClipboard}
          className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          📋 Paste from Clipboard
        </button>
      </div>

      {/* Text Area */}
      <textarea
        id="transcript-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your meeting transcript here..."
        rows={16}
        className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
      />

      {/* Footer Row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-xs text-zinc-500">
          <span>
            {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
          </span>
          <span>
            {charCount.toLocaleString()}{" "}
            {charCount === 1 ? "character" : "characters"}
          </span>
        </div>
        <button
          type="button"
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit}
          className="rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-indigo-500"
        >
          {isSubmitting ? "Processing..." : "Process Transcript"}
        </button>
      </div>
    </div>
  );
}
