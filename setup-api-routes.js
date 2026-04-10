const fs = require('fs');
const path = require('path');

// Create directories
const summarizeDir = path.join(__dirname, 'src', 'app', 'api', 'summarize');
const transcribeDir = path.join(__dirname, 'src', 'app', 'api', 'transcribe');

if (!fs.existsSync(summarizeDir)) {
  fs.mkdirSync(summarizeDir, { recursive: true });
  console.log('✅ Created:', summarizeDir);
}

if (!fs.existsSync(transcribeDir)) {
  fs.mkdirSync(transcribeDir, { recursive: true });
  console.log('✅ Created:', transcribeDir);
}

// Create summarize route
const summarizeRoute = `import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required and cannot be empty" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = \`Summarize the following text concisely in 2-3 sentences. Focus on the main points and key takeaways:\\n\\n\${text}\`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary. Please check your API key and try again." },
      { status: 500 }
    );
  }
}
`;

fs.writeFileSync(path.join(summarizeDir, 'route.ts'), summarizeRoute);
console.log('✅ Created: src/app/api/summarize/route.ts');

// Create transcribe route
const transcribeRoute = `import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const assemblyAIKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (!assemblyAIKey) {
      return NextResponse.json(
        { error: "ASSEMBLYAI_API_KEY not configured. Add it to your environment variables." },
        { status: 500 }
      );
    }

    // Upload audio file to AssemblyAI
    const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        authorization: assemblyAIKey,
      },
      body: await file.arrayBuffer(),
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload audio file");
    }

    const { upload_url } = await uploadResponse.json();

    // Request transcription
    const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: assemblyAIKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        audio_url: upload_url,
        speech_models: ["universal-2"],
      }),
    });

    if (!transcriptResponse.ok) {
      throw new Error("Failed to request transcription");
    }

    const { id: transcriptId } = await transcriptResponse.json();

    // Poll for transcription result
    let transcript;
    const maxAttempts = 60; // 5 minutes max
    
    for (let i = 0; i < maxAttempts; i++) {
      const pollingResponse = await fetch(
        \`https://api.assemblyai.com/v2/transcript/\${transcriptId}\`,
        {
          headers: {
            authorization: assemblyAIKey,
          },
        }
      );

      transcript = await pollingResponse.json();

      if (transcript.status === "completed") {
        return NextResponse.json({ text: transcript.text });
      } else if (transcript.status === "error") {
        throw new Error(transcript.error || "Transcription failed");
      }

      // Wait 5 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    throw new Error("Transcription timeout - took longer than expected");
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
`;

fs.writeFileSync(path.join(transcribeDir, 'route.ts'), transcribeRoute);
console.log('✅ Created: src/app/api/transcribe/route.ts');

console.log('\\n🎉 Setup complete! Run: npm run dev');
