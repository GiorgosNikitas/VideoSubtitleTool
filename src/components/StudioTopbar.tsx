import { Coins, LogIn, LogOut, User } from "lucide-react";
import { SubtitleLanguage } from "../lib/subtitles";
import { Translator } from "../i18n/translations";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

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
    <header className="relative z-10 flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-background px-5 py-2 max-md:flex-col max-md:items-start max-md:px-3">
      <div className="relative z-10 min-w-0">
        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{t("app.eyebrow")}</p>
        <h1 className="text-3xl font-black uppercase leading-none tracking-normal max-md:text-2xl">{t("app.title")}</h1>
      </div>
      <div className="relative z-10 flex items-center gap-3 max-md:w-full max-md:flex-col max-md:items-stretch">
        {isAuthenticated ? (
          <div className="flex flex-wrap items-center justify-end gap-2 max-md:w-full">
            <Badge className="justify-center" variant="secondary">
              <Coins size={15} />
              {t("auth.credits", { count: creditBalance ?? 0 })}
            </Badge>
            <Popover>
              <PopoverTrigger asChild>
                <Button aria-label={t("auth.account")} className="h-10 w-10" disabled={authLoading} size="icon" type="button" variant="outline">
                  <User className="!h-6 !w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="grid w-72 gap-4 p-4">
                <div className="grid gap-1">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{t("auth.account")}</div>
                  <div className="truncate text-sm font-semibold normal-case tracking-normal text-white">{authEmail}</div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                    <Coins size={13} className="text-accent" />
                    {t("auth.credits", { count: creditBalance ?? 0 })}
                  </div>
                </div>
                <Button className="w-full justify-center" disabled={authLoading} onClick={onLogout} size="sm" type="button" variant="outline">
                  <LogOut size={14} />
                  {t("auth.logout")}
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <Button disabled={authLoading} onClick={onAuthOpen} size="sm" type="button" variant="accent">
            <LogIn size={14} />
            {t("auth.login")}
          </Button>
        )}
        <div className="flex rounded-sm border border-white/10 bg-card p-1" aria-label={t("app.languageToggle")}>
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
