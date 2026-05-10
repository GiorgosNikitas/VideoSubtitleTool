import express from "express";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import multer from "multer";

const app = express();
if (!ffmpegPath) {
  throw new Error("ffmpeg-static did not provide an ffmpeg binary for this platform.");
}

const ffprobePath = ffprobeStatic.path;
if (!ffprobePath) {
  throw new Error("ffprobe-static did not provide an ffprobe binary for this platform.");
}

const uploadDir = path.join(process.cwd(), "server", "uploads");
await fs.mkdir(uploadDir, { recursive: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const welcomeCredits = Math.max(0, Math.floor(Number(process.env.WELCOME_CREDITS ?? "10")));
const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const safeExt = path.extname(file.originalname || "").toLowerCase() || ".bin";
      cb(null, `${randomUUID()}${safeExt}`);
    },
  }),
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
});

const allowedExtensions = new Set([".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v", ".mp3", ".m4a", ".wav", ".ogg"]);
const exportVideoExtensions = new Set([".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"]);
const exportFormats = new Map([
  [
    "mp4",
    {
      contentType: "video/mp4",
      extension: "mp4",
      args: ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"],
    },
  ],
  [
    "webm",
    {
      contentType: "video/webm",
      extension: "webm",
      args: ["-c:v", "libvpx-vp9", "-deadline", "good", "-crf", "31", "-b:v", "0", "-c:a", "libopus", "-b:a", "160k"],
    },
  ],
  [
    "ogg",
    {
      contentType: "video/ogg",
      extension: "ogg",
      args: ["-c:v", "libtheora", "-q:v", "7", "-c:a", "libvorbis", "-q:a", "5"],
    },
  ],
]);

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(new Error(`ffmpeg failed: ${stderr.slice(-800)}`));
    });
  });
}

async function extractAudio(inputPath) {
  const outputPath = path.join(os.tmpdir(), `${randomUUID()}.mp3`);
  await runCommand(ffmpegPath, [
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-acodec",
    "libmp3lame",
    "-ar",
    "16000",
    "-ac",
    "1",
    "-b:a",
    "64k",
    outputPath,
  ]);
  return outputPath;
}

async function getMediaDuration(inputPath) {
  const output = await runCommand(ffprobePath, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    inputPath,
  ]);
  const duration = Number(String(output).trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Could not detect media duration.");
  }
  return duration;
}

async function fileToOpenAIBlob(filePath, type = "audio/mpeg") {
  const buffer = await fs.readFile(filePath);
  return new Blob([buffer], { type });
}

function sendApiError(res, status, error, message, extra = {}) {
  res.status(status).json({ error, message, ...extra });
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function normalizeRpcRow(data) {
  return Array.isArray(data) ? data[0] : data;
}

function serializeProfile(profile) {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name ?? "",
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    creditBalance: Number(profile.credit_balance ?? 0),
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

async function ensureProfile(user) {
  const metadata = user.user_metadata ?? {};
  const fullName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : typeof metadata.display_name === "string"
          ? metadata.display_name
          : "";
  const [fallbackFirstName = "", ...fallbackLastNameParts] = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName =
    typeof metadata.first_name === "string"
      ? metadata.first_name
      : typeof metadata.given_name === "string"
        ? metadata.given_name
        : fallbackFirstName;
  const lastName =
    typeof metadata.last_name === "string"
      ? metadata.last_name
      : typeof metadata.family_name === "string"
        ? metadata.family_name
        : fallbackLastNameParts.join(" ");

  const { data, error } = await supabaseAdmin.rpc("ensure_profile", {
    p_email: user.email ?? "",
    p_first_name: firstName,
    p_last_name: lastName,
    p_user_id: user.id,
    p_welcome_credits: welcomeCredits,
  });

  if (error) throw error;
  return normalizeRpcRow(data);
}

async function requireAuth(req, res, next) {
  try {
    if (!supabaseAdmin) {
      sendApiError(
        res,
        500,
        "auth_not_configured",
        "Supabase auth is not configured on the API server. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      );
      return;
    }

    const token = bearerToken(req);
    if (!token) {
      sendApiError(res, 401, "auth_required", "Sign in before using this action.");
      return;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      sendApiError(res, 401, "invalid_token", "Your session has expired. Sign in again.");
      return;
    }

    req.auth = {
      user: data.user,
      profile: await ensureProfile(data.user),
    };
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";
    sendApiError(res, 500, "auth_failed", message);
  }
}

async function debitCredits(userId, amount, metadata) {
  const { data, error } = await supabaseAdmin.rpc("debit_credits", {
    p_amount: amount,
    p_metadata: metadata,
    p_reason: "transcription_debit",
    p_user_id: userId,
  });

  if (error) {
    if (String(error.message || "").includes("insufficient_credits")) {
      const insufficientError = new Error("Not enough credits for this transcription.");
      insufficientError.status = 402;
      insufficientError.code = "insufficient_credits";
      throw insufficientError;
    }
    throw error;
  }

  return normalizeRpcRow(data);
}

async function grantCredits(userId, amount, reason, metadata) {
  const { data, error } = await supabaseAdmin.rpc("grant_credits", {
    p_amount: amount,
    p_metadata: metadata,
    p_reason: reason,
    p_user_id: userId,
  });
  if (error) throw error;
  return normalizeRpcRow(data);
}

async function recordUsageJob({ userId, kind, status, credits = 0, durationSeconds = null, model = null, language = null, metadata = {} }) {
  const { error } = await supabaseAdmin.from("usage_jobs").insert({
    user_id: userId,
    kind,
    status,
    credits,
    duration_seconds: durationSeconds,
    model,
    language,
    metadata,
  });

  if (error) {
    console.error("usage job insert failed:", error.message);
  }
}

function transcriptionHasUsableContent(contentType, body) {
  const text = String(body ?? "").trim();
  if (!text) return false;
  if (!contentType.includes("json")) return true;

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.text === "string" && parsed.text.trim()) return true;
    if (Array.isArray(parsed.segments) && parsed.segments.some((segment) => String(segment?.text ?? "").trim())) return true;
    return false;
  } catch {
    return true;
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function numberOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatAssTime(seconds) {
  const clamped = Math.max(0, numberOr(seconds, 0));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const wholeSeconds = Math.floor(clamped % 60);
  const centiseconds = Math.floor((clamped - Math.floor(clamped)) * 100);
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function escapeAssText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\r?\n/g, "\\N");
}

function normalizeHex(value, fallback = "FFFFFF") {
  const hex = String(value ?? fallback).replace("#", "").trim().toUpperCase();
  return /^[0-9A-F]{6}$/.test(hex) ? hex : fallback;
}

function hexToAssColor(value, fallback, alpha = "00") {
  const hex = normalizeHex(value, fallback);
  const rr = hex.slice(0, 2);
  const gg = hex.slice(2, 4);
  const bb = hex.slice(4, 6);
  const aa = /^[0-9A-F]{2}$/i.test(alpha) ? alpha.toUpperCase() : "00";
  return `&H${aa}${bb}${gg}${rr}`;
}

function applyTextCase(text, textCase, language) {
  if (textCase === "uppercase") return String(text ?? "").toLocaleUpperCase(language || "en");
  if (textCase === "lowercase") return String(text ?? "").toLocaleLowerCase(language || "en");
  return String(text ?? "");
}

function fontName(value) {
  const fonts = {
    arial: "Arial",
    inter: "Inter",
    georgia: "Georgia",
    impact: "Impact",
    tahoma: "Tahoma",
    times: "Times New Roman",
    verdana: "Verdana",
  };
  return fonts[value] ?? "Arial";
}

function shadowSettings(value, fontSize) {
  if (value === "classic") return { alpha: "10", distance: Math.max(1, Math.round(fontSize * 0.08)) };
  if (value === "soft") return { alpha: "70", distance: Math.max(1, Math.round(fontSize * 0.06)) };
  if (value === "strong") return { alpha: "00", distance: Math.max(2, Math.round(fontSize * 0.12)) };
  if (value === "block") return { alpha: "00", distance: Math.max(3, Math.round(fontSize * 0.18)) };
  return { alpha: "FF", distance: 0 };
}

function assEscapeFilterPath(filePath) {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

function createAssDocument(options) {
  const width = Math.max(1, Math.round(numberOr(options.videoWidth, 1280)));
  const height = Math.max(1, Math.round(numberOr(options.videoHeight, 720)));
  const fontSize = Math.max(8, Math.round(numberOr(options.fontSize, 40)));
  const outline = Math.max(1, Math.round(fontSize * 0.16));
  const shadow = shadowSettings(options.shadowStyle, fontSize);
  const globalY = numberOr(options.globalY, 88);
  const offset = numberOr(options.offset, 0);
  const language = options.language || "en";
  const segments = Array.isArray(options.segments) ? options.segments : [];

  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "ScaledBorderAndShadow: yes",
    "WrapStyle: 0",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Caption,${fontName(options.fontFamily)},${fontSize},${hexToAssColor(options.fontColor, "FFFFFF")},&H000000FF,${hexToAssColor(options.outlineColor, "000000")},${hexToAssColor(options.shadowColor, "000000", shadow.alpha)},1,0,0,0,100,100,0,0,1,${outline},${shadow.distance},5,48,48,48,1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  const events = segments
    .map((segment) => {
      const text = applyTextCase(segment.text, options.textCase, language).trim();
      if (!text) return null;

      const start = Math.max(0, numberOr(segment.start, 0) + offset);
      const end = Math.max(start + 0.05, numberOr(segment.end, start + 2) + offset);
      const yPercent = clamp(numberOr(segment.y, globalY), 0, 100);
      const x = Math.round(width / 2);
      const y = Math.round((yPercent / 100) * height);

      return `Dialogue: 0,${formatAssTime(start)},${formatAssTime(end)},Caption,,0,0,0,,{\\an5\\q2\\pos(${x},${y})}${escapeAssText(text)}`;
    })
    .filter(Boolean);

  return `${[...header, ...events].join("\n")}\n`;
}

function parseExportOptions(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.auth.user.id,
      email: req.auth.user.email ?? "",
    },
    profile: serializeProfile(req.auth.profile),
  });
});

app.post("/api/transcribe", requireAuth, upload.single("file"), async (req, res) => {
  let audioPath;
  let chargedCredits = 0;
  let creditsReserved = false;
  let durationSeconds = 0;
  let model = "whisper-1";
  let language = "el";

  try {
    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: "Set OPENAI_API_KEY before starting the API server." });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "Missing video or audio file." });
      return;
    }

    const ext = path.extname(req.file.originalname || req.file.path).toLowerCase();
    if (!allowedExtensions.has(ext)) {
      res.status(400).json({ error: `Unsupported format. Allowed: ${[...allowedExtensions].sort().join(", ")}` });
      return;
    }

    durationSeconds = await getMediaDuration(req.file.path);
    chargedCredits = Math.max(1, Math.ceil(durationSeconds / 60));
    model = req.body.model || "whisper-1";
    language = req.body.language || "el";

    try {
      req.auth.profile = await debitCredits(req.auth.user.id, chargedCredits, {
        duration_seconds: durationSeconds,
        file_name: req.file.originalname,
        file_size: req.file.size,
        language,
        model,
      });
      creditsReserved = true;
    } catch (error) {
      if (error.status === 402) {
        sendApiError(res, 402, "insufficient_credits", "Not enough credits for this transcription.", {
          creditBalance: Number(req.auth.profile?.credit_balance ?? 0),
          creditsRequired: chargedCredits,
        });
        return;
      }
      throw error;
    }

    const responseFormat =
      req.body.response_format || (model === "whisper-1" ? "verbose_json" : model.endsWith("-diarize") ? "diarized_json" : "json");
    const formData = new FormData();
    audioPath = await extractAudio(req.file.path);
    const blob = await fileToOpenAIBlob(audioPath);

    formData.append("file", blob, `${path.basename(req.file.originalname || "audio", ext)}.mp3`);
    formData.append("model", model);
    formData.append("language", language);
    formData.append("response_format", responseFormat);
    if (model === "whisper-1" && responseFormat === "verbose_json") {
      formData.append("timestamp_granularities[]", "segment");
    }
    if (req.body.prompt) formData.append("prompt", req.body.prompt);
    if (req.body.temperature) formData.append("temperature", req.body.temperature);
    if (req.body.chunking_strategy && model.startsWith("gpt-4o")) {
      formData.append("chunking_strategy", req.body.chunking_strategy);
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const contentType = openaiResponse.headers.get("content-type") || "application/json";
    const body = await openaiResponse.text();

    if (!openaiResponse.ok || !transcriptionHasUsableContent(contentType, body)) {
      await grantCredits(req.auth.user.id, chargedCredits, "transcription_refund", {
        duration_seconds: durationSeconds,
        openai_status: openaiResponse.status,
        reason: openaiResponse.ok ? "empty_transcription" : "openai_error",
      });
      await recordUsageJob({
        userId: req.auth.user.id,
        kind: "transcription",
        status: "failed",
        credits: 0,
        durationSeconds,
        model,
        language,
        metadata: {
          charged_credits: chargedCredits,
          openai_status: openaiResponse.status,
        },
      });

      if (openaiResponse.ok) {
        sendApiError(res, 502, "empty_transcription", "The transcription response did not include usable caption text.");
        return;
      }

      res.status(openaiResponse.status).type(contentType).send(body);
      return;
    }

    await recordUsageJob({
      userId: req.auth.user.id,
      kind: "transcription",
      status: "completed",
      credits: chargedCredits,
      durationSeconds,
      model,
      language,
      metadata: {
        file_name: req.file.originalname,
        file_size: req.file.size,
      },
    });

    res.status(openaiResponse.status).type(contentType).send(body);
  } catch (error) {
    if (creditsReserved) {
      await grantCredits(req.auth.user.id, chargedCredits, "transcription_refund", {
        duration_seconds: durationSeconds,
        reason: "server_error",
      }).catch((refundError) => {
        console.error("credit refund failed:", refundError.message);
      });
      await recordUsageJob({
        userId: req.auth.user.id,
        kind: "transcription",
        status: "failed",
        credits: 0,
        durationSeconds,
        model,
        language,
        metadata: {
          charged_credits: chargedCredits,
          error: error instanceof Error ? error.message.slice(0, 500) : "unknown",
        },
      });
    }
    const message = error instanceof Error ? error.message : "Transcription failed.";
    res.status(500).json({ error: message });
  } finally {
    await Promise.allSettled([req.file?.path ? fs.unlink(req.file.path) : undefined, audioPath ? fs.unlink(audioPath) : undefined]);
  }
});

app.post("/api/export", requireAuth, upload.single("file"), async (req, res) => {
  const tempPaths = [];

  try {
    if (!req.file) {
      res.status(400).json({ error: "Missing video file." });
      return;
    }

    const ext = path.extname(req.file.originalname || req.file.path).toLowerCase();
    if (!exportVideoExtensions.has(ext)) {
      res.status(400).json({ error: `Unsupported export source format. Allowed: ${[...exportVideoExtensions].sort().join(", ")}` });
      return;
    }

    const options = parseExportOptions(req.body.options);
    const format = exportFormats.get(options.format || "webm");
    if (!format) {
      res.status(400).json({ error: "Unsupported export format." });
      return;
    }

    const assPath = path.join(os.tmpdir(), `${randomUUID()}.ass`);
    const outputPath = path.join(os.tmpdir(), `${randomUUID()}.${format.extension}`);
    tempPaths.push(assPath, outputPath);
    await fs.writeFile(assPath, createAssDocument(options), "utf8");

    const filter = `ass='${assEscapeFilterPath(assPath)}'`;
    await runCommand(ffmpegPath, ["-y", "-i", req.file.path, "-vf", filter, ...format.args, outputPath]);

    const baseName = path.basename(req.file.originalname || "video", ext).replace(/[^\w.-]+/g, "-") || "video";
    const filename = `${baseName}-captioned.${format.extension}`;
    await recordUsageJob({
      userId: req.auth.user.id,
      kind: "export",
      status: "completed",
      model: null,
      language: options.language ?? null,
      metadata: {
        file_name: req.file.originalname,
        file_size: req.file.size,
        format: format.extension,
        segment_count: Array.isArray(options.segments) ? options.segments.length : 0,
      },
    });
    res.setHeader("Content-Type", format.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.sendFile(outputPath, async (error) => {
      await Promise.allSettled([req.file?.path ? fs.unlink(req.file.path) : undefined, ...tempPaths.map((filePath) => fs.unlink(filePath))]);
      if (error && !res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    if (req.auth?.user) {
      await recordUsageJob({
        userId: req.auth.user.id,
        kind: "export",
        status: "failed",
        metadata: {
          error: error instanceof Error ? error.message.slice(0, 500) : "unknown",
        },
      });
    }
    await Promise.allSettled([req.file?.path ? fs.unlink(req.file.path) : undefined, ...tempPaths.map((filePath) => fs.unlink(filePath))]);
    const message = error instanceof Error ? error.message : "Export failed.";
    res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`Transcription API listening on http://localhost:${port}`);
});
