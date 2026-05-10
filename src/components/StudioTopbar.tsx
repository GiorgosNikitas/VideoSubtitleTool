import { Activity, Coins, LogIn, LogOut } from "lucide-react";
import { SubtitleLanguage } from "../lib/subtitles";
import { Translator } from "../i18n/translations";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

type StudioTopbarProps = {
  authEmail: string | null;
  authLoading: boolean;
  creditBalance: number | null;
  isAuthenticated: boolean;
  language: SubtitleLanguage;
  t: Translator;
  onAuthOpen: () => void;
  onLogout: () => void;
  onLanguageChange: (language: SubtitleLanguage) => void;
};

export function StudioTopbar({
  authEmail,
  authLoading,
  creditBalance,
  isAuthenticated,
  language,
  t,
  onAuthOpen,
  onLanguageChange,
  onLogout,
}: StudioTopbarProps) {
  return (
    <header className="relative z-10 flex min-h-20 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0a0a0a] px-6 py-4 max-md:flex-col max-md:items-start max-md:px-3">
      <div className="relative z-10 min-w-0">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#00ff85]">{t("app.eyebrow")}</p>
        <h1 className="text-4xl font-black uppercase leading-none tracking-normal max-md:text-3xl">{t("app.title")}</h1>
      </div>
      <div className="relative z-10 flex items-center gap-3 max-md:w-full max-md:flex-col max-md:items-stretch">
        <Badge className="justify-center" variant="accent">
          <Activity size={15} />
          {t("app.pipeline")}
        </Badge>
        {isAuthenticated ? (
          <div className="flex flex-wrap items-center gap-2 max-md:w-full">
            <Badge className="justify-center" variant="secondary">
              <Coins size={15} />
              {t("auth.credits", { count: creditBalance ?? 0 })}
            </Badge>
            <Badge className="max-w-56 justify-start overflow-hidden whitespace-nowrap normal-case" variant="default">
              <span className="truncate">{authEmail}</span>
            </Badge>
            <Button disabled={authLoading} onClick={onLogout} size="sm" type="button" variant="outline">
              <LogOut size={14} />
              {t("auth.logout")}
            </Button>
          </div>
        ) : (
          <Button disabled={authLoading} onClick={onAuthOpen} size="sm" type="button" variant="accent">
            <LogIn size={14} />
            {t("auth.login")}
          </Button>
        )}
        <div className="flex rounded-sm border border-white/10 bg-[#101010] p-1" aria-label={t("app.languageToggle")}>
          <Button
            className="min-w-12"
            onClick={() => onLanguageChange("el")}
            size="sm"
            type="button"
            variant={language === "el" ? "default" : "ghost"}
          >
            EL
          </Button>
          <Button
            className="min-w-12"
            onClick={() => onLanguageChange("en")}
            size="sm"
            type="button"
            variant={language === "en" ? "default" : "ghost"}
          >
            EN
          </Button>
        </div>
      </div>
    </header>
  );
}
