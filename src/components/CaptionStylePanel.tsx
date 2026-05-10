import { useEffect, useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { type TranslationKey, type Translator } from "../i18n/translations";
import { captionFontOptions, captionShadowOptions, textSwatches } from "../lib/editorUtils";
import { cn } from "../lib/utils";
import { type CaptionFont, type CaptionPosition, type CaptionShadowStyle, type CaptionTextCase } from "../types/editor";
import { ColorPicker } from "./ColorPicker";
import { SlidingControlRow } from "./SlidingControlRow";
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
  className?: string;
  label: string;
  max: number;
  min: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

function SliderField({ className, label, max, min, step, value, onChange }: SliderFieldProps) {
  return (
    <Label className={cn("grid min-w-44 flex-1 gap-2", className)}>
      <span className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-accent">{value.toFixed(step < 1 ? 1 : 0)}</span>
      </span>
      <Slider className="h-8" max={max} min={min} onValueChange={([next]) => onChange(next ?? value)} step={step} value={[value]} />
    </Label>
  );
}

const SYNC_STEP = 0.25;
const FONT_SIZE_OPTIONS = [16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 84, 96, 112, 128];
const POSITION_OPTIONS: Array<{ value: CaptionPosition; labelKey: TranslationKey }> = [
  { value: "top", labelKey: "style.positionTop" },
  { value: "middle", labelKey: "style.positionMiddle" },
  { value: "bottom", labelKey: "style.positionBottom" },
];

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
  const [offsetInput, setOffsetInput] = useState(formatOffsetInput(offset));
  const syncSliderMin = useMemo(() => Math.min(-3, Math.floor(offset * 2) / 2), [offset]);
  const syncSliderMax = useMemo(() => Math.max(3, Math.ceil(offset * 2) / 2), [offset]);

  useEffect(() => {
    setOffsetInput(formatOffsetInput(offset));
  }, [offset]);

  function updateOffsetInput(value: string) {
    setOffsetInput(value);
    if (["", "-", "+", ".", "-.", "+."].includes(value.trim())) return;

    const nextOffset = Number(value);
    if (Number.isFinite(nextOffset)) onOffsetChange(nextOffset);
  }

  function stepOffset(delta: number) {
    onOffsetChange(Number((offset + delta).toFixed(2)));
  }

  return (
    <div className="grid min-w-0 shrink-0 gap-3 overflow-hidden border-t border-white/10 px-6 py-3 max-md:px-3">
      <SlidingControlRow scrollLeftLabel={t("style.scrollLeft")} scrollRightLabel={t("style.scrollRight")}>
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
      </SlidingControlRow>

      <div className="min-w-0 overflow-hidden border-t border-white/10 pt-3">
        <SlidingControlRow
          contentClassName="items-start gap-x-5"
          scrollLeftLabel={t("style.scrollLeft")}
          scrollRightLabel={t("style.scrollRight")}
        >
          <div className="grid min-w-max shrink-0 gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{t("style.position")}</span>
            <div className="flex items-center gap-2">
              {POSITION_OPTIONS.map(({ value, labelKey }) => (
                <Button
                  key={value}
                  onClick={() => onPositionChange(value)}
                  size="sm"
                  type="button"
                  variant={position === value ? "default" : "outline"}
                >
                  {t(labelKey)}
                </Button>
              ))}
            </div>
          </div>

          <SliderField
            className="min-w-56 shrink-0 flex-none"
            label={t("style.globalY")}
            max={100}
            min={0}
            onChange={onGlobalCaptionYChange}
            step={0.5}
            value={globalCaptionY}
          />

          <div className="grid min-w-[24rem] shrink-0 gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{t("style.sync")}</span>
            <div className="flex items-center gap-2">
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
                  className="h-8 w-20 px-2 text-center text-xs tabular-nums text-accent"
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
        </SlidingControlRow>
      </div>
    </div>
  );
}
