import { geminiModel } from "./gemini";
import {
  EXTRACTION_SYSTEM_PROMPT,
  type ExtractionResult,
} from "./prompt";

export async function extractIntelligence(
  rawTranscript: string,
  redactPii: boolean = false
): Promise<ExtractionResult> {
  const redactionInstruction = redactPii 
    ? "\n\n7. SAFE MODE ENABLED: You MUST rigorously scrub and redact any PII (Personally Identifiable Information) from your output. Replace passwords, phone numbers, email addresses, and API keys with [REDACTED]."
    : "";

  const result = await geminiModel.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${EXTRACTION_SYSTEM_PROMPT}${redactionInstruction}\n\n---\n\n## RAW TRANSCRIPT\n\n${rawTranscript}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1, // Low temperature for factual extraction
    },
  });

  const response = result.response;
  const text = response.text();

  try {
    return JSON.parse(text) as ExtractionResult;
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${text.substring(0, 200)}`);
  }
}
