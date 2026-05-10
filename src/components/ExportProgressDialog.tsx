import { Loader2 } from "lucide-react";
import { ExportFormat } from "../types/editor";
import { Translator } from "../i18n/translations";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Progress } from "./ui/progress";

type ExportProgressDialogProps = {
  format: ExportFormat;
  open: boolean;
  progress: number;
  statusMessage: string;
  t: Translator;
};

export function ExportProgressDialog({ format, open, progress, statusMessage, t }: ExportProgressDialogProps) {
  const percent = Math.round(progress * 100);

  return (
    <Dialog open={open}>
      <DialogContent
        className="select-none"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="flex items-center gap-3 text-[#00ff85]">
          <Loader2 className="animate-spin" size={22} />
          <div>
            <DialogTitle className="text-lg font-black uppercase tracking-normal">{t("dialog.exportTitle")}</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-white/55">{t("dialog.exportSubtitle", { format: format.toUpperCase() })}</DialogDescription>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
            <span>{t("dialog.exportProgress")}</span>
            <span className="text-[#00ff85]">{percent}%</span>
          </div>
          <Progress value={percent} />
        </div>

        <p className="text-sm leading-relaxed text-white/60">{statusMessage}</p>
      </DialogContent>
    </Dialog>
  );
}
