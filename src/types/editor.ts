import { TranslationKey, TranslationParams } from "../i18n/translations";

export type Status = {
  tone: "idle" | "success" | "warning" | "error";
  key: TranslationKey;
  params?: TranslationParams;
};

export type TimelineDrag = {
  id: string;
  mode: "move" | "resize-start" | "resize-end";
  startClientX: number;
  segmentStart: number;
  segmentEnd: number;
  timelineDuration: number;
  timelineWidth: number;
  moved: boolean;
};

export type CaptionDrag = {
  id: string;
  frameTop: number;
  frameHeight: number;
  moved: boolean;
};

export type VideoSize = {
  width: number;
  height: number;
};

export type CaptionPosition = "top" | "middle" | "bottom";
export type CaptionTextCase = "original" | "uppercase" | "lowercase";
export type CaptionFont = "arial" | "inter" | "georgia" | "impact" | "tahoma" | "times" | "verdana";
export type CaptionShadowStyle = "none" | "classic" | "soft" | "strong" | "block";
export type ExportFormat = "webm" | "mp4" | "ogg";

export type ExportFormatOption = {
  extension: ExportFormat;
  label: string;
  supported: boolean;
  mimeType: string;
};

export type TextSwatch = {
  c: string;
  labelKey: TranslationKey;
};
