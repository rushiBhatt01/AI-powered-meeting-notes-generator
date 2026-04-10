"use client";

import { useRef, useState } from "react";
import { validateFile, extractTextFromFile } from "@/lib/file-utils";
import { transcribeAudioDirect } from "@/lib/transcription-client";

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
        const text = await transcribeAudioDirect(file);
        onExtract(text);
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to transcribe audio file. Try a smaller file or try again.",
          );
        } finally {
          setIsTranscribing(false);
        }
      return;
    }

    setIsProcessing(true);
    try {
      const text = await extractTextFromFile(file);
      onExtract(text);
    } catch {
      setError("Failed to extract text from document. Please try a different file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFile(file);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
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
          accept=".txt,.docx,.mp3,.wav,.m4a,.aac,.flac,.ogg"
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
              <p className="mt-1 text-xs text-zinc-500">
                {isTranscribing
                  ? "Large audio uploads can take several minutes to process."
                  : `Reading ${fileName}`}
              </p>
            </div>
          </div>
        ) : (
          <>
            <span className="mb-2 text-3xl">Audio</span>
            <p className="text-sm font-medium text-zinc-300">Drop an audio file or document here</p>
            <p className="mt-1 text-xs text-indigo-400">Click to browse files</p>
            <p className="mt-2 text-xs text-zinc-500">
              Audio (.mp3, .wav, .m4a, .aac, .flac, .ogg) up to 4MB
              <br />
              Text (.txt, .docx) up to 2MB
            </p>
          </>
        )}
      </div>

      {fileName && !isProcessing && !isTranscribing && !error && (
        <p className="text-xs text-emerald-400">Processed {fileName}</p>
      )}

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
