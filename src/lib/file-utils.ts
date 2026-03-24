import mammoth from "mammoth";

const MAX_TEXT_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB (Whisper limit)
const ALLOWED_EXTENSIONS = [".txt", ".docx", ".mp3", ".wav", ".m4a"];

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
      error: `Unsupported file type "${ext}". Only .txt, .docx, .mp3, .wav, and .m4a are accepted.`,
    };
  }

  const isAudio = [".mp3", ".wav", ".m4a"].includes(ext);
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
