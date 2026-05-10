# Subtitle Studio

A Vite + React + TypeScript app for adding Greek or English subtitles to videos.

## What it does

- Upload and preview a local video.
- Import `.srt` or `.vtt` subtitle files.
- Edit subtitle start/end times and text.
- Export `.vtt` and `.srt`.
- Render subtitles into downloadable video files with the included FFmpeg API.
- Call a configurable transcription endpoint that can wrap OpenAI audio transcription models.
- Improve transcription with explicit language, prompt/glossary, temperature, and optional auto chunking.
- Normalize uploaded video/audio to 16 kHz mono MP3 before transcription for cleaner Whisper input.
- Require Supabase login for transcription/export and charge credits by rounded-up audio minute.

## Supabase auth and credits

Create a Supabase project, then run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor. It creates:

- `profiles` with the current credit balance.
- `credit_ledger` with grants, debits, and refunds.
- `usage_jobs` with transcription/export metadata only. Uploaded videos are not stored in the database.

Add these frontend environment variables:

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your_anon_key"
VITE_API_URL="https://videosubtitletool.onrender.com"
```

For local development with the Vite proxy, `VITE_API_URL` can be omitted. For a deployed frontend, set it to the deployed API server URL.

Add these API server environment variables:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
WELCOME_CREDITS="10"
OPENAI_API_KEY="your_openai_key"
```

One credit equals one rounded-up audio minute. The API reserves credits before calling OpenAI and refunds them if transcription fails or returns no usable text.

## OpenAI transcription

Do not call OpenAI directly from the browser because that exposes your API key. Add a backend route at `/api/transcribe` that accepts `multipart/form-data` with:

- `file`
- `language` (`el` or `en`)
- `model`
- `response_format=verbose_json`
- `prompt`
- `temperature`
- `chunking_strategy`

The frontend accepts either SRT/VTT text or an OpenAI-style JSON response with `segments`.

## Run locally

```bash
npm install
npm run dev
```

For OpenAI transcription, start the included proxy API in a second terminal:

```bash
export OPENAI_API_KEY="your_key"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export WELCOME_CREDITS="10"
npm run api
```

Then keep the app's transcription endpoint as `/api/transcribe`. Vite proxies that path to `http://localhost:8787`.

The API server uses a bundled ffmpeg binary to extract audio before sending it to OpenAI. This usually gives better results than sending a full video container directly.
