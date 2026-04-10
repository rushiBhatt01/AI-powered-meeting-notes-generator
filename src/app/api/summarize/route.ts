import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

type SummarizeRequest = {
  text?: unknown;
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SummarizeRequest;

  try {
    payload = (await request.json()) as SummarizeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  try {
    const prompt = `Summarize the following text concisely in 2-3 sentences. Focus on the main points and key takeaways:\n\n${text}`;
    const result = await geminiModel.generateContent(prompt);
    const summary = result.response.text().trim();

    if (!summary) {
      return NextResponse.json(
        { error: "Gemini did not return a summary." },
        { status: 502 },
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarization route error:", error);

    return NextResponse.json(
      { error: "Failed to summarize text. Check GEMINI_API_KEY and try again." },
      { status: 500 },
    );
  }
}
