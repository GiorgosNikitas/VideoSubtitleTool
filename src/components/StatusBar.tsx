import { ChangeEvent } from "react";
import { Download, FileText, Loader2, Scissors, Sparkles, Upload } from "lucide-react";
import { ExportFormat, ExportFormatOption, Status } from "../types/editor";
import { Translator } from "../i18n/translations";
import { formatFileSize } from "../lib/editorUtils";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type StatusBarProps = {
  dirty: boolean;
  exportFormat: ExportFormat;
  exportFormatOptions: ExportFormatOption[];
  exportProgress: number;
  isBusy: boolean;
  isExporting: boolean;
  isTranscribing: boolean;
  isVideoLoading: boolean;
  segmentCount: number;
  status: Status;
  t: Translator;
  videoFile: File | null;
  videoLoadProgress: number;
  onDownloadSrt: () => void;
  onDownloadVtt: () => void;
  onExport: () => void;
  onExportFormatChange: (format: ExportFormat) => void;
  onSubtitleUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onTranscribe: () => void;
  onVideoUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function StatusBar({
  dirty,
  exportFormat,
  exportFormatOptions,
  exportProgress,
  isBusy,
  isExporting,
  isTranscribing,
  isVideoLoading,
  segmentCount,
  status,
  t,
  videoFile,
  videoLoadProgress,
  onDownloadSrt,
  onDownloadVtt,
  onExport,
  onExportFormatChange,
  onSubtitleUpload,
  onTranscribe,
  onVideoUpload,
}: StatusBarProps) {
  const stateLabel = isVideoLoading
    ? t("state.loadingVideo", { progress: Math.round(videoLoadProgress) })
    : isTranscribing
      ? t("state.transcribing")
      : isExporting
        ? t("state.exporting", { progress: Math.round(exportProgress * 100) })
        : dirty
          ? t("state.edited")
          : null;
  const stateVariant = status.tone === "error" ? "destructive" : status.tone === "warning" ? "warning" : "accent";

  return (
    <div className="relative z-10 flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-3 max-md:flex-col max-md:items-stretch max-md:px-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button asChild className={cn("cursor-pointer", isBusy && "pointer-events-none opacity-40")} size="sm" variant="outline">
          <label aria-disabled={isBusy}>
            <Upload size={14} />
            {t("action.video")}
            <Input accept="video/*" className="sr-only" disabled={isBusy} onChange={onVideoUpload} type="file" />
          </label>
        </Button>
        <Button asChild className={cn("cursor-pointer", isBusy && "pointer-events-none opacity-40")} size="sm" variant="outline">
          <label aria-disabled={isBusy}>
            <FileText size={14} />
            {t("action.subtitlesFile")}
            <Input accept=".srt,.vtt,text/vtt" className="sr-only" disabled={isBusy} onChange={onSubtitleUpload} type="file" />
          </label>
        </Button>
        {videoFile ? (
          <Badge className="max-w-[34rem] justify-start overflow-hidden whitespace-nowrap normal-case" variant="default">
            <span className="truncate">{videoFile.name}</span>
            <span className="text-white/35">
              {t("transcription.videoMeta", { size: formatFileSize(videoFile.size), type: videoFile.type || t("file.videoFallback") })}
            </span>
          </Badge>
        ) : (
          <Badge variant="default">{t("state.noVideoLoaded")}</Badge>
        )}
        {stateLabel && <Badge variant={stateVariant}>{stateLabel}</Badge>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={isBusy} onClick={onDownloadVtt} size="sm" type="button" variant="outline">
          <Download size={14} />
          {t("action.downloadVtt")}
        </Button>
        <Button disabled={isBusy} onClick={onDownloadSrt} size="sm" type="button" variant="outline">
          <Download size={14} />
          {t("action.downloadSrt")}
        </Button>
        <Button disabled={!videoFile || isBusy || isTranscribing} onClick={onTranscribe} size="sm" type="button" variant="accent">
          {isTranscribing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
          {t("action.transcribe")}
        </Button>
        <div className="flex overflow-hidden rounded-sm">
          <Button
            className="rounded-r-none"
            disabled={!videoFile || isExporting || !segmentCount}
            onClick={onExport}
            size="sm"
            type="button"
            variant="destructive"
          >
            {isExporting ? <Loader2 className="animate-spin" size={14} /> : <Scissors size={14} />}
            {t("action.burnExport")}
          </Button>
          <Select disabled={isExporting} onValueChange={(value) => onExportFormatChange(value as ExportFormat)} value={exportFormat}>
            <SelectTrigger className="h-8 w-24 rounded-l-none border border-destructive border-l-black/30 bg-destructive px-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white hover:text-black focus:ring-ring">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {exportFormatOptions.map((option) => (
                <SelectItem disabled={!option.supported} key={option.extension} value={option.extension}>
                  {t(`format.${option.extension}`)} {!option.supported ? `(${t("format.unsupported")})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {(isVideoLoading || isExporting) && (
        <Progress
          className="absolute bottom-0 left-0 h-1 rounded-none bg-transparent"
          value={isExporting ? Math.round(exportProgress * 100) : Math.round(videoLoadProgress)}
        />
      )}
    </div>
  );
}
