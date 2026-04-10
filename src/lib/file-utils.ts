import mammoth from "mammoth";

const MAX_TEXT_SIZE = 2 * 1024 * 1024; // 2MB
// Large audio is uploaded directly to Blob from the browser before transcription.
const MAX_AUDIO_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_EXTENSIONS = [".txt", ".docx", ".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  isAudio?: boolean;
}

export function validateFile(file: File): FileValidationResult {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file type "${ext}". Only .txt, .docx, .mp3, .wav, .m4a, .aac, .flac, and .ogg are accepted.`,
    };
  }

  const isAudio = [".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"].includes(ext);
  const sizeLimit = isAudio ? MAX_AUDIO_SIZE : MAX_TEXT_SIZE;

  if (file.size > sizeLimit) {
    return {
      valid: false,
      error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${sizeLimit / 1024 / 1024}MB.`,
    };
  }

  return { valid: true, isAudio };
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();

  if (ext === ".txt") {
    return await file.text();
  }

  if (ext === ".docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${ext}`);
}
