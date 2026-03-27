"use server";

import { auth } from "@clerk/nextjs/server";

export async function summarizeText(text: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!text || text.trim() === "") {
    throw new Error("No text provided");
  }

  try {
    const response = await fetch("http://localhost:8000/api/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Local NLP Summarization Error:", errorText);
      throw new Error(`Failed to summarize text using local backend: ${errorText}`);
    }

    const data = await response.json();
    return data.summary as string;
  } catch (error) {
    console.error("Local NLP Summarization Error:", error);
    throw new Error("Failed to summarize text natively.");
  }
}

