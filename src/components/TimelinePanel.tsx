import { PointerEvent, RefObject, useRef } from "react";
import { Translator } from "../i18n/translations";
import { secondsToTimestamp, SubtitleSegment } from "../lib/subtitles";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

type TimelinePanelProps = {
  activeSegmentId?: string;
  currentTime: number;
  duration: number;
  highlightedSegmentId: string | null;
  offset: number;
  segments: SubtitleSegment[];
  statusMessage: string;
  t: Translator;
  timelineDuration: number;
  timelineProgressPercent: number;
  timelineRef: RefObject<HTMLDivElement | null>;
  timelineWidth: number;
  onHoverSegment: (id: string | null) => void;
  onPointerCancel: () => void;
  onSegmentPointerDown: (event: PointerEvent<HTMLElement>, segment: SubtitleSegment, mode?: "move" | "resize-start" | "resize-end") => void;
  onSegmentPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onSegmentPointerUp: (event: PointerEvent<HTMLElement>, segment: SubtitleSegment) => void;
  onTimelineSeek: (time: number) => void;
};

export function TimelinePanel({
  activeSegmentId,
  currentTime,
  duration,
  highlightedSegmentId,
  offset,
  segments,
  statusMessage,
  t,
  timelineDuration,
  timelineProgressPercent,
  timelineRef,
  timelineWidth,
  onHoverSegment,
  onPointerCancel,
  onSegmentPointerDown,
  onSegmentPointerMove,
  onSegmentPointerUp,
  onTimelineSeek,
}: TimelinePanelProps) {
  const scrubbingRef = useRef(false);
  const safeDuration = Math.max(timelineDuration, 0.01);

  function seekFromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = rect.width ? (event.clientX - rect.left) / rect.width : 0;
    onTimelineSeek(Math.min(Math.max(percent, 0), 1) * safeDuration);
  }

  function startTimelineScrub(event: PointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    scrubbingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromPointer(event);
  }

  function moveTimelineScrub(event: PointerEvent<HTMLDivElement>) {
    if (!scrubbingRef.current) return;
    seekFromPointer(event);
  }

  function finishTimelineScrub(event: PointerEvent<HTMLDivElement>) {
    if (!scrubbingRef.current) return;
    scrubbingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
        <span className="shrink-0 tabular-nums text-white/55">
          <span className="text-[#00ff85]">{secondsToTimestamp(currentTime)}</span>
          <span className="mx-1 text-white/25">{t("playback.separator")}</span>
          {secondsToTimestamp(duration)}
        </span>
        <span className="max-w-[32rem] overflow-hidden text-ellipsis whitespace-nowrap text-right text-white/55">{statusMessage}</span>
      </div>
      <div className="overflow-x-auto pb-1">
        <div
          className="relative h-9 min-w-full cursor-crosshair overflow-hidden rounded-sm border border-white/10 bg-[#1b1b1b]"
          onPointerCancel={finishTimelineScrub}
          onPointerDown={startTimelineScrub}
          onPointerMove={moveTimelineScrub}
          onPointerUp={finishTimelineScrub}
          ref={timelineRef}
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0, transparent 41px, rgba(255,255,255,0.08) 41px, rgba(255,255,255,0.08) 42px)",
            width: `${timelineWidth}px`,
          }}
        >
          <div className="pointer-events-none absolute bottom-0 top-0 z-30 w-0.5 -translate-x-1/2 bg-[#ff3d57]" style={{ left: `${timelineProgressPercent}%` }} />
          {segments.map((segment) => {
            const shiftedStart = segment.start + offset;
            const shiftedEnd = segment.end + offset;

            if (shiftedEnd <= 0 || shiftedStart >= safeDuration) return null;

            const visibleStart = Math.max(0, shiftedStart);
            const visibleEnd = Math.min(safeDuration, shiftedEnd);
            const left = (visibleStart / safeDuration) * 100;
            const width = Math.max(0.45, ((visibleEnd - visibleStart) / safeDuration) * 100);
            const isActive = activeSegmentId === segment.id;
            const isHighlighted = highlightedSegmentId === segment.id;

            return (
              <Button
                className={cn(
                  "absolute bottom-1 top-1 h-auto min-w-4 cursor-grab touch-none rounded-[2px] border p-0 active:cursor-grabbing",
                  isActive
                    ? "z-20 border-[#ff3d57] bg-[#ff3d57] hover:bg-[#ff3d57]"
                    : isHighlighted
                      ? "z-10 border-[#00ff85] bg-[#00ff85] hover:bg-[#00ff85]"
                      : "border-white bg-white/90 hover:border-[#00ff85] hover:bg-[#00ff85]",
                )}
                key={segment.id}
                onMouseEnter={() => onHoverSegment(segment.id)}
                onMouseLeave={() => onHoverSegment(null)}
                onPointerCancel={onPointerCancel}
                onPointerDown={(event) => onSegmentPointerDown(event, segment, "move")}
                onPointerMove={onSegmentPointerMove}
                onPointerUp={(event) => onSegmentPointerUp(event, segment)}
                size="sm"
                style={{ left: `${left}%`, width: `${width}%` }}
                title={`${secondsToTimestamp(Math.max(0, shiftedStart))} - ${secondsToTimestamp(Math.max(0, shiftedEnd))}: ${segment.text}`}
                type="button"
                variant="ghost"
              >
                <span className="pointer-events-none min-w-0 truncate px-2 text-[10px] font-bold normal-case tracking-normal text-black">
                  {segment.text}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 top-0 w-2 cursor-ew-resize rounded-l-[2px] bg-black/20 transition-colors hover:bg-black/45"
                  onPointerCancel={onPointerCancel}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onSegmentPointerDown(event, segment, "resize-start");
                  }}
                  onPointerMove={onSegmentPointerMove}
                  onPointerUp={(event) => onSegmentPointerUp(event, segment)}
                />
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 right-0 top-0 w-2 cursor-ew-resize rounded-r-[2px] bg-black/20 transition-colors hover:bg-black/45"
                  onPointerCancel={onPointerCancel}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onSegmentPointerDown(event, segment, "resize-end");
                  }}
                  onPointerMove={onSegmentPointerMove}
                  onPointerUp={(event) => onSegmentPointerUp(event, segment)}
                />
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
