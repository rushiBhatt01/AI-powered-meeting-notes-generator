"use server";

import { auth } from "@clerk/nextjs/server";

export async function transcribeAudio(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");

  try {
    const response = await fetch("http://localhost:8000/api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Local NLP Transcription Error:", errorText);
      throw new Error("Failed to transcribe audio file using local backend.");
    }

    const data = await response.json();
    return data.text as string;
  } catch (error) {
    console.error("Local NLP Transcription Error:", error);
    throw new Error("Failed to transcribe audio file.");
  }
}
