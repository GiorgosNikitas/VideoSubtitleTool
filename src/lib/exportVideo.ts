import { CaptionFont, CaptionShadowStyle, CaptionTextCase, ExportFormat, ExportFormatOption } from "../types/editor";
import { apiUrl } from "./apiConfig";
import { SubtitleLanguage, SubtitleSegment } from "./subtitles";

type ExportOptions = {
  accessToken?: string | null;
  file: File;
  segments: SubtitleSegment[];
  onProgress: (progress: number) => void;
  fontSize?: number;
  fontColor?: string;
  outlineColor?: string;
  shadowColor?: string;
  shadowStyle?: CaptionShadowStyle;
  fontFamily?: CaptionFont;
  textCase?: CaptionTextCase;
  language?: SubtitleLanguage;
  format?: ExportFormat;
  globalY?: number;
  offset?: number;
  videoWidth?: number;
  videoHeight?: number;
};

type ExportResult = {
  blob: Blob;
  filename: string;
};

const EXPORT_FORMATS: Record<ExportFormat, { label: string; mimeType: string }> = {
  webm: { label: "WebM", mimeType: "video/webm" },
  mp4: { label: "MP4", mimeType: "video/mp4" },
  ogg: { label: "Ogg", mimeType: "video/ogg" },
};

export function getExportFormatOptions(): ExportFormatOption[] {
  return (Object.keys(EXPORT_FORMATS) as ExportFormat[]).map((extension) => ({
    extension,
    label: EXPORT_FORMATS[extension].label,
    mimeType: EXPORT_FORMATS[extension].mimeType,
    supported: true,
  }));
}

function filenameFromDisposition(disposition: string | null, fallback: string) {
  if (!disposition) return fallback;
  const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  return match?.[1] ? decodeURIComponent(match[1].replace(/"$/, "")) : fallback;
}

async function errorFromBlob(blob: Blob, fallback: string) {
  const text = await blob.text().catch(() => "");
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    return typeof parsed.error === "string" ? parsed.error : fallback;
  } catch {
    return text.slice(0, 500) || fallback;
  }
}

export async function exportCaptionedVideo({
  accessToken,
  file,
  segments,
  onProgress,
  fontSize,
  fontColor,
  outlineColor,
  shadowColor,
  shadowStyle = "none",
  fontFamily = "arial",
  textCase = "original",
  language = "en",
  format = "webm",
  globalY = 88,
  offset = 0,
  videoWidth = 1280,
  videoHeight = 720,
}: ExportOptions): Promise<ExportResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "options",
    JSON.stringify({
      segments,
      fontSize,
      fontColor,
      outlineColor,
      shadowColor,
      shadowStyle,
      fontFamily,
      textCase,
      language,
      format,
      globalY,
      offset,
      videoWidth,
      videoHeight,
    }),
  );

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fallbackFilename = `${file.name.replace(/\.[^.]+$/, "")}-captioned.${format}`;
    let simulatedProgress = 0.28;
    const progressTimer = window.setInterval(() => {
      simulatedProgress = Math.min(0.92, simulatedProgress + (0.92 - simulatedProgress) * 0.08);
      onProgress(simulatedProgress);
    }, 500);

    xhr.responseType = "blob";
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.min(0.28, (event.loaded / event.total) * 0.28));
    };
    xhr.onload = async () => {
      window.clearInterval(progressTimer);
      const blob = xhr.response;
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve({
          blob,
          filename: filenameFromDisposition(xhr.getResponseHeader("content-disposition"), fallbackFilename),
        });
        return;
      }

      reject(new Error(await errorFromBlob(blob, `Export service returned ${xhr.status}.`)));
    };
    xhr.onerror = () => {
      window.clearInterval(progressTimer);
      reject(new Error("Could not reach the export service."));
    };
    xhr.onabort = () => {
      window.clearInterval(progressTimer);
      reject(new Error("Export was cancelled."));
    };

    onProgress(0.04);
    xhr.open("POST", apiUrl("/api/export"));
    if (accessToken) {
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    }
    xhr.send(formData);
  });
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
