# AI-powered Notes

AI-powered Notes is a serverless meeting intelligence app built with Next.js 16. It turns meeting transcripts and audio recordings into structured outputs your team can act on.

## Project description

The application combines Clerk authentication, Postgres + Drizzle ORM, AssemblyAI transcription, Gemini-based extraction, and Inngest background processing to produce:

- Meeting summary
- Action items
- Decisions
- Deadlines

Results are saved per meeting and surfaced in a dashboard with processing states (`queued`, `processing`, `completed`, `failed`).

## Tech stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Auth | Clerk |
| Database | Postgres (Neon-compatible), Drizzle ORM |
| AI | Gemini (`gemini-2.5-flash-lite`) |
| Transcription | AssemblyAI |
| Background jobs | Inngest |
| Large uploads | Vercel Blob |

## Project workflow

1. User signs in and opens `/dashboard/new`.
2. User provides transcript input in one of three ways:
   - Paste transcript text directly.
   - Upload `.txt`/`.docx` (text is extracted client-side).
   - Upload audio (`.mp3`, `.wav`, `.m4a`, `.aac`, `.flac`, `.ogg`).
3. Audio path behavior:
   - `<= 4MB`: sent inline to `/api/transcribe`.
   - `> 4MB`: uploaded browser -> Vercel Blob -> `/api/transcribe` with `audioUrl`.
4. The transcript is submitted to `/api/meetings`.
5. A meeting is created in Postgres with status `queued`.
6. An Inngest event (`transcript.process`) is dispatched.
7. Inngest worker updates status to `processing`, runs Gemini extraction, stores `imps`, then marks the meeting `completed` (or `failed` on error).
8. Meeting detail page auto-refreshes until processing completes.

## Local development (serverless workflow)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` from `.env.example`.

- Windows PowerShell:
  ```powershell
  Copy-Item .env.example .env.local
  ```
- macOS/Linux:
  ```bash
  cp .env.example .env.local
  ```

Fill these values in `.env.local`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk frontend auth |
| `CLERK_SECRET_KEY` | Yes | Clerk server auth |
| `DATABASE_URL` | Yes | Postgres connection |
| `GEMINI_API_KEY` | Yes | Summarization/extraction |
| `ASSEMBLYAI_API_KEY` | Yes | Audio transcription |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL for server-side internal API calls |
| `INNGEST_EVENT_KEY` | Yes (prod) | Inngest event publishing |
| `INNGEST_SIGNING_KEY` | Yes (prod) | Inngest signature verification |
| `BLOB_READ_WRITE_TOKEN` | Required for `>4MB` audio | Browser-to-Blob upload flow |

### 3. Start dev servers

```bash
npm run dev:next
```

This starts both:

- Next.js app on `http://localhost:3000`
- Inngest dev server (for local event handling)

## Serverless setup and deployment

Use [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full serverless setup, Vercel deployment, Inngest connection, and troubleshooting guide.

## Notes

- The repo includes `nlp-backend/` for legacy/local experimentation, but the active app flow is serverless.
- If you change DB schema, use the Drizzle config at `drizzle.config.ts`.
