import { ChangeEvent, CSSProperties, PointerEvent, RefObject } from "react";
import { FileVideo } from "lucide-react";
import { Translator } from "../i18n/translations";
import { SubtitleSegment } from "../lib/subtitles";
import { cn } from "../lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type VideoPreviewProps = {
  activeCaption: (SubtitleSegment & { y: number }) | null;
  activeSegment?: SubtitleSegment;
  previewFrameRef: RefObject<HTMLDivElement | null>;
  t: Translator;
  videoRef: RefObject<HTMLVideoElement | null>;
  videoStageStyle: CSSProperties;
  videoUrl: string;
  onCaptionPointerDown: (event: PointerEvent<HTMLElement>, segment: SubtitleSegment) => void;
  onCaptionPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onCaptionPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onDurationChange: (video: HTMLVideoElement) => void;
  onPause: () => void;
  onPlay: () => void;
  onSeeked: (time: number) => void;
  onTimeUpdate: (time: number) => void;
  onVideoError: () => void;
  onVideoUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function VideoPreview({
  activeCaption,
  activeSegment,
  previewFrameRef,
  t,
  videoRef,
  videoStageStyle,
  videoUrl,
  onCaptionPointerDown,
  onCaptionPointerMove,
  onCaptionPointerUp,
  onDurationChange,
  onPause,
  onPlay,
  onSeeked,
  onTimeUpdate,
  onVideoError,
  onVideoUpload,
}: VideoPreviewProps) {
  const captionTextStyle = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 3,
    textShadow:
      "0.06em 0.06em 0 var(--caption-outline), -0.06em -0.06em 0 var(--caption-outline), 0.06em -0.06em 0 var(--caption-outline), -0.06em 0.06em 0 var(--caption-outline), 0 0.08em 0 var(--caption-outline), 0.08em 0 0 var(--caption-outline), 0 -0.08em 0 var(--caption-outline), -0.08em 0 0 var(--caption-outline), var(--caption-shadow)",
  } as CSSProperties;

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black p-4 max-md:p-3">
      <div
        className={cn(
          "relative max-h-full overflow-hidden bg-black",
          videoUrl
            ? "h-full max-w-full [container-type:inline-size]"
            : "flex aspect-video w-[min(100%,56rem)] items-center justify-center rounded-sm border-2 border-dashed border-white/20",
        )}
        ref={previewFrameRef}
        style={videoStageStyle}
      >
        {videoUrl ? (
          <>
            <video
              data-testid="video-element"
              onDurationChange={(event) => onDurationChange(event.currentTarget)}
              onError={onVideoError}
              onLoadedMetadata={(event) => onDurationChange(event.currentTarget)}
              onPause={onPause}
              onPlay={onPlay}
              onSeeked={(event) => onSeeked(event.currentTarget.currentTime)}
              onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
              ref={videoRef}
              src={videoUrl}
              className="block h-full w-full object-cover"
            />
            {activeCaption && activeSegment && (
              <div
                className="absolute left-0 right-0 z-10 flex -translate-y-1/2 touch-none select-none justify-center px-[4%] text-center"
                data-testid="caption-overlay"
                onPointerCancel={onCaptionPointerUp}
                onPointerDown={(event) => onCaptionPointerDown(event, activeSegment)}
                onPointerMove={onCaptionPointerMove}
                onPointerUp={onCaptionPointerUp}
                role="button"
                style={{ top: `${activeCaption.y}%` }}
                tabIndex={0}
              >
                <span
                  className="max-w-full cursor-grab overflow-hidden break-words text-center font-bold leading-[1.15] text-[length:var(--caption-font-size)] text-[var(--caption-color)] active:cursor-grabbing [font-family:var(--caption-font-family)]"
                  style={captionTextStyle}
                >
                  {activeCaption.text}
                </span>
              </div>
            )}
          </>
        ) : (
          <Label className="flex h-full min-h-80 w-full cursor-pointer flex-col items-center justify-center gap-3 p-8 text-center uppercase text-white/55 transition-colors hover:border-white/40 hover:bg-white/[0.03]">
            <FileVideo size={56} />
            <strong className="text-3xl font-black leading-none text-white max-md:text-2xl">{t("preview.dropVideo")}</strong>
            <span>{t("preview.acceptedFormats")}</span>
            <Input accept="video/*" className="sr-only" onChange={onVideoUpload} type="file" />
          </Label>
        )}
      </div>
    </div>
  );
}
