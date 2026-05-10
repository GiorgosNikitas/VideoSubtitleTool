import { MutableRefObject } from "react";
import { Captions, Loader2, Play, Plus, Sparkles, Trash2, Type } from "lucide-react";
import { Translator } from "../i18n/translations";
import { clamp, formatTimeInput, parseTimeInput } from "../lib/editorUtils";
import { SubtitleSegment } from "../lib/subtitles";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

type SubtitleListProps = {
  activeSegmentId?: string;
  canTranscribe: boolean;
  globalCaptionY: number;
  highlightedSegmentId: string | null;
  isTranscribing: boolean;
  offset: number;
  rowRefs: MutableRefObject<Record<string, HTMLElement | null>>;
  segments: SubtitleSegment[];
  t: Translator;
  onAddAfter: (id: string | null) => void;
  onDelete: (id: string) => void;
  onHoverSegment: (id: string | null) => void;
  onPlaySegment: (segment: SubtitleSegment) => void;
  onSeekToSegment: (segment: SubtitleSegment) => void;
  onTranscribe: () => void;
  onUpdateSegment: (id: string, patch: Partial<SubtitleSegment>) => void;
};

export function SubtitleList({
  activeSegmentId,
  canTranscribe,
  globalCaptionY,
  highlightedSegmentId,
  isTranscribing,
  offset,
  rowRefs,
  segments,
  t,
  onAddAfter,
  onDelete,
  onHoverSegment,
  onPlaySegment,
  onSeekToSegment,
  onTranscribe,
  onUpdateSegment,
}: SubtitleListProps) {
  return (
    <>
      <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
          <Type size={14} />
          {t("subtitles.title")}
        </span>
        <Badge variant="secondary">{t("subtitles.lines", { count: segments.length })}</Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!segments.length && (
          <div className="flex min-h-full flex-col items-center justify-center gap-3 p-8 text-center text-white/55">
            <span className="flex gap-1"><Captions/>{t("subtitles.empty")}</span>
            <Button disabled={!canTranscribe || isTranscribing} onClick={onTranscribe} type="button" variant="accent">
              {isTranscribing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
              {t("action.transcribe")}
            </Button>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">{t("common.or")}</span>
            <Button onClick={() => onAddAfter(null)} type="button" variant="outline">
              {t("action.addFirstLine")}
            </Button>
          </div>
        )}

        {segments.map((segment, index) => {
          const isActive = activeSegmentId === segment.id;
          const isHighlighted = highlightedSegmentId === segment.id;
          const captionY = segment.y ?? globalCaptionY;
          const syncedStart = segment.start + offset;
          const syncedEnd = segment.end + offset;

          return (
            <article
              className={cn(
                "grid cursor-pointer grid-cols-[3rem_minmax(0,1fr)] gap-3 border-b border-white/10 px-4 py-2 transition-colors max-md:grid-cols-1",
                isActive && "border-l-4 border-l-destructive bg-muted pl-3",
                isHighlighted && !isActive && "bg-card",
              )}
              key={segment.id}
              onClick={() => onSeekToSegment(segment)}
              onMouseEnter={() => onHoverSegment(segment.id)}
              onMouseLeave={() => onHoverSegment(null)}
              ref={(element) => {
                rowRefs.current[segment.id] = element;
              }}
            >
              <div className="flex h-9 items-center justify-start px-0 text-sm font-semibold text-white/35">
                #{String(index + 1).padStart(2, "0")}
              </div>
              <div className="grid min-w-0 gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Input
                    aria-label={t("subtitles.startTime")}
                    className="h-9 w-[5.25rem] px-2 text-xs leading-5 tabular-nums"
                    onChange={(event) => onUpdateSegment(segment.id, { start: parseTimeInput(event.target.value) - offset })}
                    value={formatTimeInput(syncedStart)}
                  />
                  <span className="text-white/35">→</span>
                  <Input
                    aria-label={t("subtitles.endTime")}
                    className="h-9 w-[5.25rem] px-2 text-xs leading-5 tabular-nums"
                    onChange={(event) => onUpdateSegment(segment.id, { end: parseTimeInput(event.target.value) - offset })}
                    value={formatTimeInput(syncedEnd)}
                  />
                  <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                    Y
                    <Input
                      aria-label={t("subtitles.yPosition")}
                      className="h-9 w-[4.75rem] px-2 text-xs leading-5 tabular-nums"
                      max={100}
                      min={0}
                      onChange={(event) => onUpdateSegment(segment.id, { y: Number(clamp(Number(event.target.value), 0, 100).toFixed(1)) })}
                      step={0.5}
                      type="number"
                      value={captionY.toFixed(1)}
                    />
                  </label>
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      onPlaySegment(segment);
                    }}
                    size="icon"
                    title={t("subtitles.playSegment")}
                    type="button"
                    variant="ghost"
                  >
                    <Play size={13} />
                  </Button>
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddAfter(segment.id);
                    }}
                    size="icon"
                    title={t("subtitles.addBelow")}
                    type="button"
                    variant="ghost"
                  >
                    <Plus size={13} />
                  </Button>
                  <Button
                    className="hover:bg-destructive/10 hover:text-destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(segment.id);
                    }}
                    size="icon"
                    title={t("subtitles.delete")}
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
                <Textarea
                  aria-label={t("subtitles.captionText")}
                  className="min-h-16 w-full resize-y py-2"
                  onChange={(event) => onUpdateSegment(segment.id, { text: event.target.value })}
                  rows={2}
                  value={segment.text}
                />
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
