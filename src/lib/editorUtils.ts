import { makeSegment } from "./subtitles";
import { TranslationKey, Translator } from "../i18n/translations";
import { SubtitleLanguage } from "./subtitles";
import { CaptionFont, CaptionPosition, CaptionShadowStyle, CaptionTextCase, TextSwatch } from "../types/editor";

export function createSampleSegments(language: SubtitleLanguage, t: Translator) {
  return language === "el"
    ? [
        makeSegment({ start: 0, end: 2.8, text: t("sample.greekOne") }),
        makeSegment({ start: 3.2, end: 6.4, text: t("sample.greekTwo") }),
      ]
    : [
        makeSegment({ start: 0, end: 2.7, text: t("sample.englishOne") }),
        makeSegment({ start: 3.1, end: 6.2, text: t("sample.englishTwo") }),
      ];
}

export const textSwatches: TextSwatch[] = [
  { c: "FFFFFF", labelKey: "swatch.white" },
  { c: "00FF85", labelKey: "swatch.green" },
  { c: "FFEB3B", labelKey: "swatch.yellow" },
  { c: "FF3DA0", labelKey: "swatch.pink" },
  { c: "00E5FF", labelKey: "swatch.cyan" },
  { c: "FF5722", labelKey: "swatch.orange" },
  { c: "000000", labelKey: "swatch.black" },
];

export const captionFontOptions: { value: CaptionFont; label: string; family: string }[] = [
  { value: "arial", label: "Arial", family: "Arial, Helvetica, sans-serif" },
  { value: "inter", label: "Inter", family: "Inter, ui-sans-serif, system-ui, sans-serif" },
  { value: "georgia", label: "Georgia", family: "Georgia, serif" },
  { value: "impact", label: "Impact", family: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" },
  { value: "tahoma", label: "Tahoma", family: "Tahoma, Geneva, sans-serif" },
  { value: "times", label: "Times", family: "'Times New Roman', Times, serif" },
  { value: "verdana", label: "Verdana", family: "Verdana, Geneva, sans-serif" },
];

export const captionShadowOptions: { value: CaptionShadowStyle; labelKey: TranslationKey }[] = [
  { value: "none", labelKey: "style.shadowNone" },
  { value: "classic", labelKey: "style.shadowClassic" },
  { value: "soft", labelKey: "style.shadowSoft" },
  { value: "strong", labelKey: "style.shadowStrong" },
  { value: "block", labelKey: "style.shadowBlock" },
];

export const captionPositionDefaults: Record<CaptionPosition, { y: number }> = {
  top: { y: 12 },
  middle: { y: 50 },
  bottom: { y: 88 },
};

export function getCaptionFontFamily(font: CaptionFont) {
  return captionFontOptions.find((option) => option.value === font)?.family ?? captionFontOptions[0].family;
}

function alphaHex(hex: string, alpha: number) {
  const clampedAlpha = Math.min(1, Math.max(0, alpha));
  return `#${cleanHex(hex)}${Math.round(clampedAlpha * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase()}`;
}

export function getCaptionShadowCss(shadow: CaptionShadowStyle, color: string) {
  if (shadow === "classic") return `0.08em 0.08em 0.05em ${alphaHex(color, 0.9)}`;
  if (shadow === "soft") return `0 0.14em 0.35em ${alphaHex(color, 0.6)}`;
  if (shadow === "strong") return `0.09em 0.09em 0 ${alphaHex(color, 0.9)}, 0.16em 0.16em 0.08em ${alphaHex(color, 0.8)}`;
  if (shadow === "block") return `0.08em 0.08em 0 ${alphaHex(color, 1)}, 0.16em 0.16em 0 ${alphaHex(color, 1)}, 0.24em 0.24em 0 ${alphaHex(color, 1)}`;
  return "0 0 0 transparent";
}

export function applyCaptionCase(text: string, textCase: CaptionTextCase, locale: SubtitleLanguage) {
  if (textCase === "uppercase") return text.toLocaleUpperCase(locale);
  if (textCase === "lowercase") return text.toLocaleLowerCase(locale);
  return text;
}

export function formatTimeInput(seconds: number) {
  return seconds.toFixed(2);
}

export function parseTimeInput(value: string) {
  const normalized = value.trim();
  if (normalized.includes(":")) {
    const parts = normalized.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return Math.max(0, Number(normalized) || 0);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function cleanHex(value: string) {
  const hex = value.replace("#", "").trim().toUpperCase();
  return /^[0-9A-F]{6}$/.test(hex) ? hex : "FFFFFF";
}
