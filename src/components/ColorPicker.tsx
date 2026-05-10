import { CSSProperties } from "react";
import { Pipette } from "lucide-react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { cleanHex } from "../lib/editorUtils";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type ColorPreset = {
  label: string;
  value: string;
};

type ColorPickerProps = {
  customLabel: string;
  label: string;
  hideLabel?: boolean;
  presets?: ColorPreset[];
  value: string;
  className?: string;
  onChange: (color: string) => void;
};

function normalizeColor(value: string) {
  return `#${cleanHex(value)}`;
}

export function ColorPicker({ className, customLabel, hideLabel = false, label, presets = [], value, onChange }: ColorPickerProps) {
  const selectedColor = normalizeColor(value);

  function updateColor(nextColor: string) {
    onChange(cleanHex(nextColor));
  }

  const content = (
    <div className="flex items-center gap-2">
      {presets.map((preset) => {
        const presetColor = cleanHex(preset.value);

        return (
          <Button
            aria-label={preset.label}
            className={cn(
              "h-7 w-7 border-2 p-0 hover:bg-[var(--swatch)]",
              cleanHex(value) === presetColor ? "border-[#00ff85] ring-1 ring-[#00ff85]" : "border-white/20",
            )}
            key={presetColor}
            onClick={() => onChange(presetColor)}
            size="icon"
            style={{ "--swatch": `#${presetColor}`, backgroundColor: `#${presetColor}` } as CSSProperties}
            title={preset.label}
            type="button"
            variant="ghost"
          />
        );
      })}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            aria-label={`${customLabel}: ${selectedColor}`}
            className="h-7 w-7 border-2 border-white/20 p-0 hover:border-white/45 hover:bg-[var(--selected-color)]"
            size="icon"
            style={{ "--selected-color": selectedColor, backgroundColor: selectedColor } as CSSProperties}
            title={customLabel}
            type="button"
            variant="ghost"
          >
            <Pipette className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]" size={12} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" collisionPadding={16}>
          <div className="grid gap-3">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.14em] text-white/45" title={customLabel}>
                {customLabel}
              </span>
              <span className="text-xs font-semibold tabular-nums text-[#00ff85]">{selectedColor.toUpperCase()}</span>
            </div>
            <div>
              <HexColorPicker color={selectedColor} onChange={updateColor} style={{ width: "100%" }} />
            </div>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-8 w-8 shrink-0 rounded-sm border border-white/15"
                style={{ backgroundColor: selectedColor }}
              />
              <HexColorInput
                aria-label={customLabel}
                className="h-8 min-w-0 flex-1 rounded-sm border border-white/10 bg-[#0a0a0a] px-3 text-xs font-semibold uppercase tabular-nums text-white outline-none focus:border-[#00ff85] focus:ring-1 focus:ring-[#00ff85]"
                color={selectedColor}
                onChange={updateColor}
                prefixed
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  if (hideLabel) {
    return <div className={cn("grid gap-2", className)}>{content}</div>;
  }

  return (
    <Label className={cn("grid gap-2", className)}>
      <span>{label}</span>
      {content}
    </Label>
  );
}
