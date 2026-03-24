"use server";

import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";

export async function transcribeAudio(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY. Please add it to .env.local to enable audio transcription.");
  }

  // Initialize lazily to prevent server crashing on startup without the key
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "en", 
      response_format: "text",
    });

    // OpenAI returns raw text when response_format="text"
    return response as unknown as string;
  } catch (error) {
    console.error("OpenAI Transcription Error:", error);
    throw new Error("Failed to transcribe audio file.");
  }
}
