import { SlidersHorizontal } from "lucide-react";
import { Translator } from "../i18n/translations";
import { SubtitleLanguage } from "../lib/subtitles";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";

type TranscriptionPanelProps = {
  autoChunking: boolean;
  language: SubtitleLanguage;
  model: string;
  prompt: string;
  t: Translator;
  temperature: number;
  onAutoChunkingChange: (enabled: boolean) => void;
  onLanguageChange: (language: SubtitleLanguage) => void;
  onModelChange: (model: string) => void;
  onPromptChange: (prompt: string) => void;
  onTemperatureChange: (temperature: number) => void;
};

const TRANSCRIPTION_MODEL_OPTIONS = ["whisper-1", "gpt-4o-mini-transcribe", "gpt-4o-transcribe", "gpt-4o-transcribe-diarize"];
const LANGUAGE_OPTIONS: SubtitleLanguage[] = ["el", "en"];

export function TranscriptionPanel({
  autoChunking,
  language,
  model,
  prompt,
  t,
  temperature,
  onAutoChunkingChange,
  onLanguageChange,
  onModelChange,
  onPromptChange,
  onTemperatureChange,
}: TranscriptionPanelProps) {
  return (
    <div className="shrink-0 border-b border-white/10 p-4">
      <div className="grid grid-cols-2 gap-3">
        <Label className="grid gap-2">
          <span>{t("transcription.model")}</span>
          <Select onValueChange={onModelChange} value={model}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSCRIPTION_MODEL_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>

        <Label className="grid gap-2">
          <span>{t("transcription.language")}</span>
          <Select onValueChange={(value) => onLanguageChange(value as SubtitleLanguage)} value={language}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(option === "el" ? "language.greek" : "language.english")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>
      </div>

      <Accordion className="mt-3" collapsible type="single">
        <AccordionItem value="algorithm">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={14} />
              {t("transcription.algorithmSettings")}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-3">
              <Label className="grid gap-2">
                <span>{t("transcription.temperature", { temperature: temperature.toFixed(1) })}</span>
                <Slider max={1} min={0} onValueChange={([value]) => onTemperatureChange(value ?? 0)} step={0.1} value={[temperature]} />
              </Label>

              <Label className="grid gap-2">
                <span>{t("transcription.prompt")}</span>
                <Textarea className="min-h-20 resize-y normal-case" onChange={(event) => onPromptChange(event.target.value)} value={prompt} />
              </Label>

              <Label className="flex items-center gap-2 text-white/55">
                <Switch checked={autoChunking} onCheckedChange={onAutoChunkingChange} />
                {t("transcription.autoChunking")}
              </Label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
