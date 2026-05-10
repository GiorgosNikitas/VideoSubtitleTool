import { ChangeEvent, CSSProperties, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createTranslator } from "../i18n/translations";
import { apiUrl } from "../lib/apiConfig";
import {
  applyCaptionCase,
  captionPositionDefaults,
  clamp,
  cleanHex,
  getCaptionFontFamily,
  getCaptionShadowCss,
} from "../lib/editorUtils";
import { downloadBlob, exportCaptionedVideo, getExportFormatOptions } from "../lib/exportVideo";
import {
  downloadTextFile,
  formatSrt,
  formatVtt,
  makeSegment,
  parseSubtitles,
  parseTranscriptionResponse,
  SubtitleLanguage,
  SubtitleSegment,
} from "../lib/subtitles";
import {
  CaptionDrag,
  CaptionFont,
  CaptionPosition,
  CaptionShadowStyle,
  CaptionTextCase,
  ExportFormat,
  Status,
  TimelineDrag,
  VideoSize,
} from "../types/editor";

const DEFAULT_LANGUAGE: SubtitleLanguage = "el";
const DEFAULT_VIDEO_SIZE: VideoSize = { width: 16, height: 9 };
const TRANSCRIPTION_ENDPOINT = apiUrl("/api/transcribe");

type UseSubtitleEditorOptions = {
  accessToken?: string | null;
  isAuthenticated?: boolean;
  onAccountRefresh?: () => Promise<unknown> | unknown;
  onAuthRequired?: () => void;
};

function defaultPrompt(language: SubtitleLanguage) {
  return createTranslator(language)(language === "el" ? "prompt.greek" : "prompt.english");
}

async function errorMessageFromResponse(response: Response, fallback: string) {
  const text = await response.text().catch(() => "");
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text) as { message?: unknown; error?: unknown; creditBalance?: unknown; creditsRequired?: unknown };
    const message = typeof parsed.message === "string" ? parsed.message : typeof parsed.error === "string" ? parsed.error : fallback;
    if (response.status === 402 && typeof parsed.creditsRequired === "number" && typeof parsed.creditBalance === "number") {
      return `${message} Required: ${parsed.creditsRequired}. Balance: ${parsed.creditBalance}.`;
    }
    return message;
  } catch {
    return text.slice(0, 500) || fallback;
  }
}

export function useSubtitleEditor({
  accessToken = null,
  isAuthenticated = false,
  onAccountRefresh,
  onAuthRequired,
}: UseSubtitleEditorOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<TimelineDrag | null>(null);
  const captionDragRef = useRef<CaptionDrag | null>(null);
  const segmentPlaybackRef = useRef<{ id: string; end: number } | null>(null);
  const rowRefs = useRef<Record<string, HTMLElement | null>>({});
  const videoLoadingTimerRef = useRef<number | null>(null);
  const videoLoadingToastRef = useRef<string | number | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoSize, setVideoSize] = useState<VideoSize>(DEFAULT_VIDEO_SIZE);
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [uiLanguage, setUiLanguage] = useState<SubtitleLanguage>(DEFAULT_LANGUAGE);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<SubtitleLanguage>(DEFAULT_LANGUAGE);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [model, setModel] = useState("whisper-1");
  const [transcriptionPrompt, setTranscriptionPrompt] = useState(defaultPrompt(DEFAULT_LANGUAGE));
  const [temperature, setTemperature] = useState(0);
  const [autoChunking, setAutoChunking] = useState(true);
  const [fontSize, setFontSize] = useState(40);
  const [fontColor, setFontColor] = useState("FFFFFF");
  const [outlineColor, setOutlineColor] = useState("000000");
  const [shadowColor, setShadowColor] = useState("000000");
  const [shadowStyle, setShadowStyle] = useState<CaptionShadowStyle>("none");
  const [fontFamily, setFontFamily] = useState<CaptionFont>("arial");
  const [textCase, setTextCase] = useState<CaptionTextCase>("original");
  const [position, setPosition] = useState<CaptionPosition>("bottom");
  const [globalCaptionY, setGlobalCaptionYState] = useState(captionPositionDefaults.bottom.y);
  const [offset, setOffset] = useState(0);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("webm");
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoLoadProgress, setVideoLoadProgress] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [status, setStatus] = useState<Status>({
    tone: "idle",
    key: "status.initial",
  });

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    return () => {
      if (videoLoadingTimerRef.current) window.clearInterval(videoLoadingTimerRef.current);
    };
  }, []);

  function stopVideoLoadingTimer() {
    if (videoLoadingTimerRef.current) {
      window.clearInterval(videoLoadingTimerRef.current);
      videoLoadingTimerRef.current = null;
    }
  }

  function startVideoLoading(file: File) {
    stopVideoLoadingTimer();
    setIsVideoLoading(true);
    setVideoLoadProgress(8);
    setStatus({ tone: "idle", key: "status.videoLoading", params: { name: file.name } });
    if (videoLoadingToastRef.current) toast.dismiss(videoLoadingToastRef.current);
    videoLoadingToastRef.current = toast.loading(t("toast.videoLoading"), {
      description: file.name,
    });
    videoLoadingTimerRef.current = window.setInterval(() => {
      setVideoLoadProgress((progress) => Math.min(94, progress + Math.max(2, Math.round((100 - progress) * 0.14))));
    }, 180);
  }

  function finishVideoLoading(video: HTMLVideoElement) {
    setDuration(video.duration || 0);
    if (video.videoWidth && video.videoHeight) {
      setVideoSize({ width: video.videoWidth, height: video.videoHeight });
    }
    if (!videoLoadingToastRef.current) return;

    stopVideoLoadingTimer();
    setVideoLoadProgress(100);
    setIsVideoLoading(false);
    if (videoFile) setStatus({ tone: "success", key: "status.videoReady", params: { name: videoFile.name } });
    toast.success(t("toast.videoReady"), {
      id: videoLoadingToastRef.current,
      description: videoFile?.name,
    });
    videoLoadingToastRef.current = null;
    window.setTimeout(() => setVideoLoadProgress(0), 700);
  }

  function failVideoLoading() {
    stopVideoLoadingTimer();
    setIsVideoLoading(false);
    setVideoLoadProgress(0);
    setStatus({ tone: "error", key: "status.videoLoadFailed" });
    toast.error(t("toast.videoLoadFailed"), {
      id: videoLoadingToastRef.current ?? undefined,
    });
    videoLoadingToastRef.current = null;
  }

  const t = useMemo(() => createTranslator(uiLanguage), [uiLanguage]);
  const activeTime = currentTime - offset;
  const activeSegment = useMemo(
    () => segments.find((segment) => activeTime >= segment.start && activeTime < segment.end),
    [activeTime, segments],
  );
  const exportFormatOptions = useMemo(() => getExportFormatOptions(), []);

  const shiftedTimelineEnd = segments.reduce((end, segment) => Math.max(end, segment.end + offset), 0);
  const timelineDuration = Math.max(duration, shiftedTimelineEnd, 10);
  const highlightedSegmentId = hoveredSegmentId ?? selectedSegmentId ?? activeSegment?.id ?? null;
  const timelineProgressPercent = clamp((currentTime / timelineDuration) * 100, 0, 100);
  const timelineWidth = Math.max(860, timelineDuration * 42);
  const captionFontPercent = videoSize.width > 32 ? (fontSize / videoSize.width) * 100 : 3.8;
  const resolvedActiveCaption = activeSegment
    ? {
        ...activeSegment,
        text: applyCaptionCase(activeSegment.text, textCase, transcriptionLanguage),
        y: clamp(activeSegment.y ?? globalCaptionY, 0, 100),
      }
    : null;

  const videoStageStyle = {
    "--video-aspect": videoSize.width / videoSize.height || 16 / 9,
    "--caption-font-size": `${captionFontPercent}cqw`,
    "--caption-color": `#${cleanHex(fontColor)}`,
    "--caption-outline": `#${cleanHex(outlineColor)}`,
    "--caption-shadow": getCaptionShadowCss(shadowStyle, shadowColor),
    "--caption-font-family": getCaptionFontFamily(fontFamily),
    aspectRatio: `${videoSize.width} / ${videoSize.height}`,
  } as CSSProperties;

  useEffect(() => {
    if (!activeSegment) return;
    rowRefs.current[activeSegment.id]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeSegment?.id]);

  function replaceSegments(nextSegments: SubtitleSegment[], nextStatus?: Status, markDirty = false) {
    setSegments([...nextSegments].sort((a, b) => a.start - b.start));
    setDirty(markDirty);
    if (nextStatus) setStatus(nextStatus);
  }

  function updateLanguagePrompt(nextLanguage: SubtitleLanguage) {
    setTranscriptionLanguage(nextLanguage);
    setTranscriptionPrompt(defaultPrompt(nextLanguage));
  }

  function updateSegment(id: string, patch: Partial<SubtitleSegment>) {
    setSegments((current) =>
      current
        .map((segment) => {
          if (segment.id !== id) return segment;
          const next = { ...segment, ...patch };
          if (next.end <= next.start) next.end = next.start + 0.25;
          return next;
        })
        .sort((a, b) => a.start - b.start),
    );
    setDirty(true);
  }

  function updateAllCaptionPositions(nextY: number) {
    const y = Number(clamp(nextY, 0, 100).toFixed(1));
    setGlobalCaptionYState(y);
    setSegments((current) => current.map((segment) => ({ ...segment, y })));
    setDirty(true);
    setStatus({ tone: "idle", key: "status.globalPositionUpdated" });
  }

  function updateGlobalCaptionY(value: number) {
    updateAllCaptionPositions(value);
  }

  function updateCaptionPositionPreset(nextPosition: CaptionPosition) {
    const defaults = captionPositionDefaults[nextPosition];
    setPosition(nextPosition);
    updateAllCaptionPositions(defaults.y);
  }

  function syncVideoMetadata(video: HTMLVideoElement) {
    finishVideoLoading(video);
  }

  function handleCurrentTimeChange(time: number) {
    const activeRange = segmentPlaybackRef.current;
    if (activeRange && time >= activeRange.end) {
      const endTime = activeRange.end;
      segmentPlaybackRef.current = null;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = endTime;
      }
      setCurrentTime(endTime);
      setPlaying(false);
      return;
    }

    setCurrentTime(time);
  }

  function seekTo(time: number, clearSegmentPlayback = true) {
    if (clearSegmentPlayback) segmentPlaybackRef.current = null;
    const nextTime = clamp(time, 0, duration || timelineDuration);
    if (videoRef.current) videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function seekToSegment(segment: SubtitleSegment) {
    setSelectedSegmentId(segment.id);
    seekTo(segment.start + offset);
  }

  function playSegment(segment: SubtitleSegment) {
    setSelectedSegmentId(segment.id);

    const rangeStart = clamp(segment.start + offset, 0, duration || timelineDuration);
    const rangeEnd = clamp(segment.end + offset, rangeStart + 0.01, duration || timelineDuration);
    segmentPlaybackRef.current = { id: segment.id, end: rangeEnd };
    seekTo(rangeStart, false);

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = rangeStart;
    void video.play();
    setPlaying(true);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    segmentPlaybackRef.current = null;

    if (video.paused) {
      void video.play();
      setPlaying(true);
      return;
    }

    video.pause();
    setPlaying(false);
  }

  function handleVideoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    startVideoLoading(file);
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setCurrentTime(0);
    setDuration(0);
    setVideoSize(DEFAULT_VIDEO_SIZE);
    setSelectedSegmentId(null);
    setHoveredSegmentId(null);
    setPlaying(false);
    segmentPlaybackRef.current = null;
    event.target.value = "";
  }

  async function handleSubtitleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = parseSubtitles(await file.text());
      if (!parsed.length) {
        setStatus({ tone: "error", key: "status.invalidSubtitleFile" });
        toast.error(t("toast.subtitleImportError"), { description: t("status.invalidSubtitleFile") });
        return;
      }

      replaceSegments(parsed, {
        tone: "success",
        key: "status.importedCaptions",
        params: { count: parsed.length, name: file.name },
      });
      toast.success(t("toast.subtitleImportSuccess"), { description: t("status.importedCaptions", { count: parsed.length, name: file.name }) });
    } catch (error) {
      setStatus({ tone: "error", key: "status.invalidSubtitleFile" });
      toast.error(t("toast.subtitleImportError"), {
        description: error instanceof Error ? error.message : t("status.invalidSubtitleFile"),
      });
    } finally {
      event.target.value = "";
    }
  }

  async function handleTranscribe() {
    if (!videoFile) {
      setStatus({ tone: "warning", key: "status.uploadBeforeTranscription" });
      toast.warning(t("status.uploadBeforeTranscription"));
      return;
    }

    if (!requireAuthenticated("status.loginBeforeTranscription")) return;

    setIsTranscribing(true);
    setStatus({ tone: "idle", key: "status.extractingAudio" });
    const transcriptionToast = toast.loading(t("toast.transcriptionStarted"), {
      description: t("status.extractingAudio"),
    });

    try {
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("language", transcriptionLanguage);
      formData.append("model", model);
      formData.append("prompt", transcriptionPrompt);
      formData.append("temperature", String(temperature));
      formData.append(
        "response_format",
        model === "whisper-1" ? "verbose_json" : model === "gpt-4o-transcribe-diarize" ? "diarized_json" : "json",
      );

      if (autoChunking && model.startsWith("gpt-4o")) {
        formData.append("chunking_strategy", "auto");
      }

      const response = await fetch(TRANSCRIPTION_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await errorMessageFromResponse(response, `Transcription service returned ${response.status}.`));
      }

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json") ? await response.json() : await response.text();
      const parsed = parseTranscriptionResponse(payload);

      if (!parsed.length) {
        throw new Error(t("status.emptyTranscription"));
      }

      replaceSegments(parsed, {
        tone: "success",
        key: "status.generatedCaptions",
        params: {
          count: parsed.length,
          language: t(transcriptionLanguage === "el" ? "language.greek" : "language.english"),
        },
      });
      setSelectedSegmentId(parsed[0]?.id ?? null);
      toast.success(t("toast.transcriptionSuccess"), {
        id: transcriptionToast,
        description: t("status.generatedCaptions", {
          count: parsed.length,
          language: t(transcriptionLanguage === "el" ? "language.greek" : "language.english"),
        }),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("status.transcriptionFailed");
      setStatus({
        tone: "error",
        key: "status.transcriptionFailed",
        params: { error: errorMessage },
      });
      toast.error(t("toast.transcriptionError"), {
        id: transcriptionToast,
        description: errorMessage,
      });
    } finally {
      setIsTranscribing(false);
      refreshAccountQuietly();
    }
  }

  function addSegmentAfter(id: string | null) {
    const index = id ? segments.findIndex((segment) => segment.id === id) : -1;
    const base = index >= 0 ? segments[index] : undefined;
    const start = base ? base.end : Math.max(0, currentTime - offset);
    const next = makeSegment({
      start: Number(start.toFixed(2)),
      end: Number((start + 2).toFixed(2)),
      text: t("subtitles.newCaption"),
      y: globalCaptionY,
    });

    const updated = [...segments];
    updated.splice(index + 1, 0, next);
    replaceSegments(updated, { tone: "idle", key: "status.addedSubtitleLine" }, true);
    setSelectedSegmentId(next.id);
  }

  function deleteSegment(id: string) {
    if (segmentPlaybackRef.current?.id === id) segmentPlaybackRef.current = null;
    replaceSegments(segments.filter((segment) => segment.id !== id), { tone: "idle", key: "status.deletedSubtitleLine" }, true);
  }

  function shiftSegments(delta: number) {
    replaceSegments(
      segments.map((segment) =>
        makeSegment({
          ...segment,
          id: segment.id,
          start: Math.max(0, Number((segment.start + delta).toFixed(2))),
          end: Math.max(0.25, Number((segment.end + delta).toFixed(2))),
        }),
      ),
      { tone: "idle", key: "status.shiftedCaptions", params: { delta: `${delta > 0 ? "+" : ""}${delta.toFixed(2)}` } },
      true,
    );
  }

  function updateUiLanguage(nextLanguage: SubtitleLanguage) {
    setUiLanguage(nextLanguage);
  }

  function requireAuthenticated(statusKey: "status.loginBeforeTranscription" | "status.loginBeforeExport") {
    if (isAuthenticated && accessToken) return true;

    setStatus({ tone: "warning", key: statusKey });
    toast.warning(t("toast.authRequired"), {
      description: t(statusKey),
    });
    onAuthRequired?.();
    return false;
  }

  function refreshAccountQuietly() {
    void Promise.resolve(onAccountRefresh?.()).catch(() => undefined);
  }

  function startTimelineDrag(event: PointerEvent<HTMLElement>, segment: SubtitleSegment, mode: TimelineDrag["mode"] = "move") {
    const track = timelineRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    dragRef.current = {
      id: segment.id,
      mode,
      startClientX: event.clientX,
      segmentStart: segment.start,
      segmentEnd: segment.end,
      timelineDuration,
      timelineWidth: rect.width,
      moved: false,
    };
    setSelectedSegmentId(segment.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveTimelineSegment(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag) return;

    const length = Math.max(0.25, drag.segmentEnd - drag.segmentStart);
    const deltaSeconds = ((event.clientX - drag.startClientX) / drag.timelineWidth) * drag.timelineDuration;
    const minLength = 0.25;
    let roundedStart = drag.segmentStart;
    let roundedEnd = drag.segmentEnd;

    if (drag.mode === "resize-start") {
      roundedStart = Number(clamp(drag.segmentStart + deltaSeconds, 0, drag.segmentEnd - minLength).toFixed(2));
      roundedEnd = Number(drag.segmentEnd.toFixed(2));
    } else if (drag.mode === "resize-end") {
      roundedStart = Number(drag.segmentStart.toFixed(2));
      roundedEnd = Number(clamp(drag.segmentEnd + deltaSeconds, drag.segmentStart + minLength, drag.timelineDuration).toFixed(2));
    } else {
      const nextStart = clamp(drag.segmentStart + deltaSeconds, 0, Math.max(0, drag.timelineDuration - length));
      roundedStart = Number(nextStart.toFixed(2));
      roundedEnd = Number((roundedStart + length).toFixed(2));
    }

    drag.moved = Math.abs(deltaSeconds) > 0.03;

    setSegments((current) =>
      current
        .map((segment) =>
          segment.id === drag.id
            ? {
                ...segment,
                start: roundedStart,
                end: roundedEnd,
              }
            : segment,
        )
        .sort((a, b) => a.start - b.start),
    );
    setDirty(true);
  }

  function finishTimelineDrag(event: PointerEvent<HTMLElement>, segment: SubtitleSegment) {
    const didMove = dragRef.current?.moved;
    const mode = dragRef.current?.mode;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!didMove && mode === "move") {
      seekToSegment(segment);
      return;
    }

    if (didMove) {
      setStatus({ tone: "idle", key: mode === "move" ? "status.movedCaption" : "status.resizedCaption" });
    }
  }

  function moveCaptionToPointer(clientY: number) {
    const drag = captionDragRef.current;
    if (!drag) return;

    const y = Number(clamp(((clientY - drag.frameTop) / Math.max(1, drag.frameHeight)) * 100, 0, 100).toFixed(1));

    setSegments((current) => current.map((segment) => (segment.id === drag.id ? { ...segment, y } : segment)));
    setDirty(true);
    drag.moved = true;
  }

  function startCaptionDrag(event: PointerEvent<HTMLElement>, segment: SubtitleSegment) {
    const frame = previewFrameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    captionDragRef.current = {
      id: segment.id,
      frameTop: rect.top,
      frameHeight: rect.height,
      moved: false,
    };
    setSelectedSegmentId(segment.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveCaptionDrag(event: PointerEvent<HTMLElement>) {
    if (!captionDragRef.current) return;
    moveCaptionToPointer(event.clientY);
  }

  function finishCaptionDrag(event: PointerEvent<HTMLElement>) {
    const didMove = captionDragRef.current?.moved;
    captionDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!didMove) return;
    setStatus({ tone: "idle", key: "status.captionPositionUpdated" });
    toast.info(t("toast.positionUpdated"));
  }

  async function handleVideoExport() {
    if (!videoFile) {
      setStatus({ tone: "warning", key: "status.uploadBeforeExport" });
      toast.warning(t("status.uploadBeforeExport"));
      return;
    }

    if (!requireAuthenticated("status.loginBeforeExport")) return;

    videoRef.current?.pause();
    setPlaying(false);
    setIsExporting(true);
    setExportProgress(0);
    setStatus({ tone: "idle", key: "status.burningSubtitles" });
    const exportToast = toast.loading(t("toast.exportStarted"), {
      description: t("status.burningSubtitles"),
    });

    try {
      const result = await exportCaptionedVideo({
        file: videoFile,
        segments,
        onProgress: setExportProgress,
        fontSize,
        fontColor,
        outlineColor,
        shadowColor,
        shadowStyle,
        fontFamily,
        textCase,
        language: transcriptionLanguage,
        format: exportFormat,
        globalY: globalCaptionY,
        offset,
        accessToken,
        videoWidth: videoSize.width,
        videoHeight: videoSize.height,
      });
      downloadBlob(result.filename, result.blob);
      setDirty(false);
      setStatus({ tone: "success", key: "status.exported", params: { name: result.filename } });
      toast.success(t("toast.exportSuccess"), {
        id: exportToast,
        description: t("status.exported", { name: result.filename }),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("status.videoExportFailed");
      setStatus({
        tone: "error",
        key: "status.videoExportFailed",
        params: { error: errorMessage },
      });
      toast.error(t("toast.exportError"), {
        id: exportToast,
        description: errorMessage,
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      refreshAccountQuietly();
    }
  }

  return {
    refs: {
      previewFrameRef,
      rowRefs,
      timelineRef,
      videoRef,
    },
    state: {
      activeCaption: resolvedActiveCaption,
      activeSegment,
      autoChunking,
      currentTime,
      dirty,
      duration,
      exportFormat,
      exportFormatOptions,
      exportProgress,
      fontColor,
      fontFamily,
      fontSize,
      globalCaptionY,
      highlightedSegmentId,
      isExporting,
      isTranscribing,
      isVideoLoading,
      transcriptionLanguage,
      uiLanguage,
      model,
      offset,
      outlineColor,
      playing,
      position,
      segments,
      shadowColor,
      shadowStyle,
      status,
      statusMessage: t(status.key, status.params),
      temperature,
      textCase,
      timelineDuration,
      timelineProgressPercent,
      timelineWidth,
      transcriptionPrompt,
      videoFile,
      videoLoadProgress,
      videoStageStyle,
      videoUrl,
    },
    actions: {
      addSegmentAfter,
      deleteSegment,
      downloadSrt: () => downloadTextFile("subtitles.srt", formatSrt(segments)),
      downloadVtt: () => downloadTextFile("subtitles.vtt", formatVtt(segments)),
      finishCaptionDrag,
      finishTimelineDrag,
      handleSubtitleUpload,
      handleTranscribe,
      handleVideoExport,
      handleVideoLoadError: failVideoLoading,
      handleVideoUpload,
      setUiLanguage: updateUiLanguage,
      moveCaptionDrag,
      moveTimelineSegment,
      playSegment,
      seekTo,
      seekToSegment,
      setAutoChunking,
      setExportFormat,
      setFontColor,
      setFontFamily,
      setFontSize,
      setGlobalCaptionY: updateGlobalCaptionY,
      setHoveredSegmentId,
      setModel,
      setOffset,
      setOutlineColor,
      setPlaying,
      setPosition: updateCaptionPositionPreset,
      setShadowColor,
      setShadowStyle,
      setTemperature,
      setTextCase,
      setTranscriptionPrompt,
      setCurrentTime: handleCurrentTimeChange,
      shiftSegments,
      startCaptionDrag,
      startTimelineDrag,
      syncVideoMetadata,
      togglePlay,
      updateLanguagePrompt,
      updateSegment,
      clearTimelineDrag: () => {
        dragRef.current = null;
      },
    },
    t,
  };
}
