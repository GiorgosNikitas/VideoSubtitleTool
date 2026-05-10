import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Palette } from "lucide-react";
import { Translator } from "../i18n/translations";
import { captionFontOptions, captionShadowOptions, textSwatches } from "../lib/editorUtils";
import { CaptionFont, CaptionPosition, CaptionShadowStyle, CaptionTextCase } from "../types/editor";
import { ColorPicker } from "./ColorPicker";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";

type CaptionStylePanelProps = {
  fontColor: string;
  fontFamily: CaptionFont;
  fontSize: number;
  globalCaptionY: number;
  offset: number;
  outlineColor: string;
  position: CaptionPosition;
  shadowColor: string;
  shadowStyle: CaptionShadowStyle;
  t: Translator;
  textCase: CaptionTextCase;
  onFontColorChange: (color: string) => void;
  onFontFamilyChange: (font: CaptionFont) => void;
  onFontSizeChange: (size: number) => void;
  onGlobalCaptionYChange: (y: number) => void;
  onOffsetChange: (offset: number) => void;
  onOutlineColorChange: (color: string) => void;
  onPositionChange: (position: CaptionPosition) => void;
  onShadowColorChange: (color: string) => void;
  onShadowStyleChange: (shadow: CaptionShadowStyle) => void;
  onTextCaseChange: (textCase: CaptionTextCase) => void;
};

type SliderFieldProps = {
  label: string;
  max: number;
  min: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

function SliderField({ label, max, min, step, value, onChange }: SliderFieldProps) {
  return (
    <Label className="grid min-w-44 flex-1 gap-2">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[#00ff85]">{value.toFixed(step < 1 ? 1 : 0)}</span>
      </span>
      <Slider max={max} min={min} onValueChange={([next]) => onChange(next ?? value)} step={step} value={[value]} />
    </Label>
  );
}

const SYNC_STEP = 0.25;
const FONT_SIZE_OPTIONS = [16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 84, 96, 112, 128];

function formatOffsetInput(value: number) {
  return Number(value.toFixed(2)).toString();
}

export function CaptionStylePanel({
  fontColor,
  fontFamily,
  fontSize,
  globalCaptionY,
  offset,
  outlineColor,
  position,
  shadowColor,
  shadowStyle,
  t,
  textCase,
  onFontColorChange,
  onFontFamilyChange,
  onFontSizeChange,
  onGlobalCaptionYChange,
  onOffsetChange,
  onOutlineColorChange,
  onPositionChange,
  onShadowColorChange,
  onShadowStyleChange,
  onTextCaseChange,
}: CaptionStylePanelProps) {
  const styleScrollerRef = useRef<HTMLDivElement | null>(null);
  const styleScrollAnimationRef = useRef<number | null>(null);
  const [offsetInput, setOffsetInput] = useState(formatOffsetInput(offset));
  const [styleScroll, setStyleScroll] = useState({ left: false, right: false });
  const syncSliderMin = useMemo(() => Math.min(-3, Math.floor(offset * 2) / 2), [offset]);
  const syncSliderMax = useMemo(() => Math.max(3, Math.ceil(offset * 2) / 2), [offset]);

  function updateStyleScrollState() {
    const scroller = styleScrollerRef.current;
    if (!scroller) return;

    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const scrollLeft = Math.min(maxScrollLeft, Math.max(0, scroller.scrollLeft));
    const nextState = {
      left: scrollLeft > 1,
      right: scrollLeft < maxScrollLeft - 1,
    };

    setStyleScroll((currentState) =>
      currentState.left === nextState.left && currentState.right === nextState.right ? currentState : nextState,
    );
  }

  useEffect(() => {
    setOffsetInput(formatOffsetInput(offset));
  }, [offset]);

  useEffect(() => {
    updateStyleScrollState();
  });

  useEffect(() => {
    const scroller = styleScrollerRef.current;
    if (!scroller) return;

    const resizeObserver = new ResizeObserver(updateStyleScrollState);
    resizeObserver.observe(scroller);
    scroller.addEventListener("scroll", updateStyleScrollState, { passive: true });
    window.addEventListener("resize", updateStyleScrollState);
    updateStyleScrollState();

    return () => {
      if (styleScrollAnimationRef.current) {
        window.cancelAnimationFrame(styleScrollAnimationRef.current);
      }
      resizeObserver.disconnect();
      scroller.removeEventListener("scroll", updateStyleScrollState);
      window.removeEventListener("resize", updateStyleScrollState);
    };
  }, []);

  function updateOffsetInput(value: string) {
    setOffsetInput(value);
    if (["", "-", "+", ".", "-.", "+."].includes(value.trim())) return;

    const nextOffset = Number(value);
    if (Number.isFinite(nextOffset)) onOffsetChange(nextOffset);
  }

  function stepOffset(delta: number) {
    onOffsetChange(Number((offset + delta).toFixed(2)));
  }

  function scrollStyleRow(direction: -1 | 1) {
    const scroller = styleScrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction * Math.max(220, scroller.clientWidth * 0.65),
      behavior: "smooth",
    });

    let frames = 0;
    const watchScroll = () => {
      updateStyleScrollState();
      frames += 1;
      if (frames < 28) {
        styleScrollAnimationRef.current = window.requestAnimationFrame(watchScroll);
      }
    };

    if (styleScrollAnimationRef.current) {
      window.cancelAnimationFrame(styleScrollAnimationRef.current);
    }
    styleScrollAnimationRef.current = window.requestAnimationFrame(watchScroll);
  }

  return (
    <div className="grid shrink-0 gap-3 border-t border-white/10 px-6 py-3 max-md:px-3">
      <div className="relative min-w-0">
        {styleScroll.left && (
          <Button
            aria-label={t("style.scrollLeft")}
            className="absolute bottom-1 left-0 top-1 z-20 h-auto w-9 border-white/20 bg-[#101010]/95 p-0 shadow-xl hover:border-white/45"
            onClick={() => scrollStyleRow(-1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronLeft size={15} />
          </Button>
        )}
        <div className="min-w-0 overflow-hidden">
          <div
            className="flex min-w-0 flex-nowrap items-center gap-x-5 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={updateStyleScrollState}
            ref={styleScrollerRef}
          >
            <span className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
              <Palette size={14} />
              {t("style.title")}
            </span>

            <Label className="grid min-w-28 shrink-0 gap-2">
              <span>{t("style.size")}</span>
              <Select onValueChange={(value) => onFontSizeChange(Number(value))} value={String(fontSize)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Label>

            <Label className="grid min-w-40 shrink-0 gap-2">
              <span>{t("style.font")}</span>
              <Select onValueChange={(value) => onFontFamilyChange(value as CaptionFont)} value={fontFamily}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {captionFontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Label>

            <Label className="grid min-w-36 shrink-0 gap-2">
              <span>{t("style.case")}</span>
              <Select onValueChange={(value) => onTextCaseChange(value as CaptionTextCase)} value={textCase}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">{t("style.caseOriginal")}</SelectItem>
                  <SelectItem value="uppercase">{t("style.caseUpper")}</SelectItem>
                  <SelectItem value="lowercase">{t("style.caseLower")}</SelectItem>
                </SelectContent>
              </Select>
            </Label>

            <ColorPicker
              className="shrink-0"
              customLabel={t("style.customTextColor")}
              label={t("style.text")}
              onChange={onFontColorChange}
              presets={textSwatches.map((swatch) => ({ label: t(swatch.labelKey), value: swatch.c }))}
              value={fontColor}
            />

            <ColorPicker
              className="shrink-0"
              customLabel={t("style.customOutlineColor")}
              label={t("style.outline")}
              onChange={onOutlineColorChange}
              presets={[
                { label: `${t("style.outline")} #000000`, value: "000000" },
                { label: `${t("style.outline")} #FFFFFF`, value: "FFFFFF" },
              ]}
              value={outlineColor}
            />

            <Label className="grid min-w-[13rem] shrink-0 gap-2">
              <span>{t("style.shadow")}</span>
              <div className="flex items-center gap-2">
                <Select onValueChange={(value) => onShadowStyleChange(value as CaptionShadowStyle)} value={shadowStyle}>
                  <SelectTrigger className="h-8 min-w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {captionShadowOptions.map((shadow) => (
                      <SelectItem key={shadow.value} value={shadow.value}>
                        {t(shadow.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ColorPicker
                  className="shrink-0"
                  customLabel={t("style.customShadowColor")}
                  hideLabel
                  label={t("style.shadowColor")}
                  onChange={onShadowColorChange}
                  value={shadowColor}
                />
              </div>
            </Label>
          </div>
        </div>

        {styleScroll.right && (
          <Button
            aria-label={t("style.scrollRight")}
            className="absolute bottom-1 right-0 top-1 z-20 h-auto w-9 border-white/20 bg-[#101010]/95 p-0 shadow-xl hover:border-white/45"
            onClick={() => scrollStyleRow(1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronRight size={15} />
          </Button>
        )}
      </div>

      <div className="grid gap-3 border-t border-white/10 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{t("style.position")}</span>
          {[
            ["top", t("style.positionTop")],
            ["middle", t("style.positionMiddle")],
            ["bottom", t("style.positionBottom")],
          ].map(([value, label]) => (
            <Button
              key={value}
              onClick={() => onPositionChange(value as CaptionPosition)}
              size="sm"
              type="button"
              variant={position === value ? "default" : "outline"}
            >
              {label}
            </Button>
          ))}
          <span className="ml-2 text-xs text-white/40">{t("style.positionHint")}</span>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <SliderField label={t("style.globalY")} max={100} min={0} onChange={onGlobalCaptionYChange} step={0.5} value={globalCaptionY} />

          <div className="ml-auto flex min-w-72 items-center gap-2 max-md:ml-0 max-md:w-full max-md:min-w-0">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{t("style.sync")}</span>
            <div className="inline-flex h-8 items-center overflow-hidden rounded-sm border border-white/15 bg-white/[0.03]">
              <Button className="h-8 rounded-none border-0 px-2" onClick={() => stepOffset(-SYNC_STEP)} size="sm" type="button" variant="ghost">
                -
              </Button>
              <Button className="h-8 rounded-none border-y-0 border-l border-r border-white/10 px-2" onClick={() => stepOffset(SYNC_STEP)} size="sm" type="button" variant="ghost">
                +
              </Button>
              <span className="px-2 text-xs font-semibold tabular-nums text-white/55">{SYNC_STEP.toFixed(2)}s</span>
            </div>
            <Slider
              className="min-w-32 flex-1"
              max={syncSliderMax}
              min={syncSliderMin}
              onValueChange={([value]) => onOffsetChange(value ?? 0)}
              step={0.1}
              value={[offset]}
            />
            <div className="flex h-8 items-center gap-1">
              <Input
                aria-label={t("style.sync")}
                className="h-8 w-20 px-2 text-center text-xs tabular-nums text-[#00ff85]"
                onBlur={() => setOffsetInput(formatOffsetInput(offset))}
                onChange={(event) => updateOffsetInput(event.target.value)}
                step={0.01}
                type="number"
                value={offsetInput}
              />
              <span className="text-xs font-semibold text-white/40">s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
