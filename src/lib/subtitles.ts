export type SubtitleLanguage = "el" | "en";

export type SubtitleSegment = {
  id: string;
  start: number;
  end: number;
  text: string;
  y?: number;
};

type OpenAISegment = {
  start?: number;
  end?: number;
  text?: string;
  speaker?: string;
};

export function makeSegment(partial: Partial<SubtitleSegment> = {}): SubtitleSegment {
  return {
    id: partial.id ?? crypto.randomUUID(),
    start: partial.start ?? 0,
    end: partial.end ?? 2,
    text: partial.text ?? "",
  };
}

export function secondsToTimestamp(seconds: number, separator: "." | "," = ".") {
  const clamped = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const wholeSeconds = Math.floor(clamped % 60);
  const millis = Math.round((clamped - Math.floor(clamped)) * 1000);

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    `${String(wholeSeconds).padStart(2, "0")}${separator}${String(millis).padStart(3, "0")}`,
  ].join(":");
}

export function timestampToSeconds(value: string) {
  const match = value.trim().match(/(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})(?:[,.](\d{1,3}))?/);
  if (!match) return 0;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const millis = Number((match[4] ?? "0").padEnd(3, "0"));

  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

export function parseSubtitles(input: string): SubtitleSegment[] {
  const normalized = input.replace(/\r/g, "").replace(/^WEBVTT[^\n]*\n+/i, "").trim();
  if (!normalized) return [];

  return normalized
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
      if (timeLineIndex === -1) return null;

      const [startRaw, endRaw] = lines[timeLineIndex].split("-->").map((part) => part.trim().split(/\s+/)[0]);
      const text = lines.slice(timeLineIndex + 1).join("\n").trim();
      if (!text) return null;

      return makeSegment({
        start: timestampToSeconds(startRaw),
        end: timestampToSeconds(endRaw),
        text,
      });
    })
    .filter((segment): segment is SubtitleSegment => Boolean(segment))
    .sort((a, b) => a.start - b.start);
}

export function parseTranscriptionResponse(payload: unknown): SubtitleSegment[] {
  if (typeof payload === "string") {
    return parseSubtitles(payload);
  }

  if (!payload || typeof payload !== "object") return [];
  const maybeSegments = (payload as { segments?: OpenAISegment[] }).segments;

  if (Array.isArray(maybeSegments)) {
    return maybeSegments
      .map((segment) => {
        const speaker = segment.speaker ? `${segment.speaker}: ` : "";
        return makeSegment({
          start: Number(segment.start ?? 0),
          end: Number(segment.end ?? Number(segment.start ?? 0) + 2),
          text: `${speaker}${String(segment.text ?? "").trim()}`.trim(),
        });
      })
      .filter((segment) => segment.text)
      .sort((a, b) => a.start - b.start);
  }

  const text = (payload as { text?: unknown }).text;
  if (typeof text === "string") {
    return [
      makeSegment({
        start: 0,
        end: 4,
        text: text.trim(),
      }),
    ].filter((segment) => segment.text);
  }

  return [];
}

export function formatVtt(segments: SubtitleSegment[]) {
  const body = segments
    .map((segment) => `${secondsToTimestamp(segment.start)} --> ${secondsToTimestamp(segment.end)}\n${segment.text}`)
    .join("\n\n");

  return `WEBVTT\n\n${body}\n`;
}

export function formatSrt(segments: SubtitleSegment[]) {
  return `${segments
    .map(
      (segment, index) =>
        `${index + 1}\n${secondsToTimestamp(segment.start, ",")} --> ${secondsToTimestamp(segment.end, ",")}\n${segment.text}`,
    )
    .join("\n\n")}\n`;
}

export function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function activeSubtitle(segments: SubtitleSegment[], currentTime: number) {
  return activeSubtitleSegment(segments, currentTime)?.text ?? "";
}

export function activeSubtitleSegment(segments: SubtitleSegment[], currentTime: number) {
  return segments.find((segment) => currentTime >= segment.start && currentTime <= segment.end) ?? null;
}
