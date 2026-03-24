"use client";

import { useState, useRef } from "react";
import { validateFile, extractTextFromFile } from "@/lib/file-utils";
import { transcribeAudio } from "@/app/actions/transcribe";

interface FileDropzoneProps {
  onExtract: (text: string) => void;
}

export default function FileDropzone({ onExtract }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setFileName(null);

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid file.");
      return;
    }

    setFileName(file.name);

    if (validation.isAudio) {
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const text = await transcribeAudio(formData);
        onExtract(text);
      } catch (e: any) {
        setError(e.message || "Failed to transcribe audio file. Check API keys or try again.");
      } finally {
        setIsTranscribing(false);
      }
    } else {
      setIsProcessing(true);
      try {
        const text = await extractTextFromFile(file);
        onExtract(text);
      } catch {
        setError("Failed to extract text from document. Please try a different file.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file selection triggers onChange again
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/5"
            : "border-zinc-700 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-900/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.docx,.mp3,.wav,.m4a"
          onChange={handleInputChange}
          className="hidden"
        />

        {isProcessing || isTranscribing ? (
          <div className="space-y-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-indigo-500" />
            <div>
              <p className="text-sm font-medium text-zinc-300">
                {isTranscribing ? "Transcribing Audio..." : "Extracting Text..."}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {isTranscribing ? "This might take up to a minute depending on file length." : `Reading ${fileName}`}
              </p>
            </div>
          </div>
        ) : (
          <>
            <span className="mb-2 text-3xl">🎙️</span>
            <p className="text-sm font-medium text-zinc-300">
              Drop an audio file or document here
            </p>
            <p className="mt-1 text-xs text-indigo-400">
              Click to browse files
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Audio (.mp3, .wav, .m4a) up to 25MB<br />
              Text (.txt, .docx) up to 2MB
            </p>
          </>
        )}
      </div>

      {/* Success indicator */}
      {fileName && !isProcessing && !error && (
        <p className="text-xs text-emerald-400">
          ✓ Extracted text from {fileName}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
