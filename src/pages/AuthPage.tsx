import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { LegalFooter } from "../components/LegalFooter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { createTranslator, Translator } from "../i18n/translations";
import { useAuth } from "../hooks/useAuth";
import { SubtitleLanguage } from "../lib/subtitles";
import { cn } from "../lib/utils";

type AuthPageProps = {
  mode: "login" | "signup";
};

type PasswordFieldProps = {
  autoComplete: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M21.805 10.023h-9.58v3.955h5.508c-.238 1.277-.963 2.36-2.052 3.087v2.565h3.322c1.944-1.79 3.064-4.426 3.064-7.55 0-.717-.064-1.41-.262-2.057Z"
        fill="#4285F4"
      />
      <path
        d="M12.225 22c2.775 0 5.104-.918 6.778-2.37l-3.322-2.565c-.922.617-2.1.982-3.456.982-2.68 0-4.95-1.805-5.762-4.232H3.03v2.648C4.694 19.765 8.118 22 12.225 22Z"
        fill="#34A853"
      />
      <path d="M6.463 13.815a5.99 5.99 0 0 1 0-3.63V7.537H3.03a10.004 10.004 0 0 0 0 8.926l3.433-2.648Z" fill="#FBBC05" />
      <path
        d="M12.225 5.953c1.51 0 2.868.52 3.936 1.54l2.916-2.906C17.318 2.95 14.99 2 12.225 2 8.118 2 4.694 4.235 3.03 7.537l3.433 2.648c.812-2.427 3.081-4.232 5.762-4.232Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function PasswordField({ autoComplete, label, value, onChange }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Label className="grid gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</span>
      <div className="relative">
        <Input
          autoComplete={autoComplete}
          className="pr-10"
          minLength={8}
          onChange={(event) => onChange(event.target.value)}
          required
          type={visible ? "text" : "password"}
          value={value}
        />
        <Button
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 border-0 p-0"
          onClick={() => setVisible((current) => !current)}
          size="icon"
          type="button"
          variant="ghost"
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </Button>
      </div>
    </Label>
  );
}

function passwordRules(password: string, t: Translator) {
  return [
    { valid: password.length >= 8, label: t("auth.passwordRuleLength") },
    { valid: /[A-Za-z]/.test(password), label: t("auth.passwordRuleLetter") },
    { valid: /\d/.test(password), label: t("auth.passwordRuleNumber") },
    { valid: /[^A-Za-z0-9]/.test(password), label: t("auth.passwordRuleSymbol") },
  ];
}

export function AuthPage({ mode }: AuthPageProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [language, setLanguage] = useState<SubtitleLanguage>("el");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const t = useMemo(() => createTranslator(language), [language]);
  const rules = useMemo(() => passwordRules(password, t), [password, t]);
  const isLogin = mode === "login";
  const passwordsMatch = password && password === passwordRepeat;

  useEffect(() => {
    if (auth.isAuthenticated) navigate(next, { replace: true });
  }, [auth.isAuthenticated, navigate, next]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      if (!isLogin) {
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error(t("auth.nameRequired"));
        }
        if (rules.some((rule) => !rule.valid)) {
          throw new Error(t("auth.passwordRequirements"));
        }
        if (!passwordsMatch) {
          throw new Error(t("auth.passwordMismatch"));
        }
      }

      const result = isLogin
        ? await auth.signIn(email, password)
        : await auth.signUp(email, password, { firstName, lastName });
      if (result.needsEmailConfirmation) {
        setMessage(t("auth.checkEmail"));
        return;
      }
      navigate(next, { replace: true });
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : t("auth.error"));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setOauthBusy(true);
    setMessage("");
    setError("");

    try {
      await auth.signInWithGoogle(new URL(next, window.location.origin).toString());
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : t("auth.error"));
      setOauthBusy(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background font-mono text-foreground">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--accent)_/_0.08)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--accent)_/_0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_28%,hsl(var(--accent)_/_0.24),transparent_18rem),radial-gradient(circle_at_80%_72%,hsl(var(--muted-foreground)_/_0.22),transparent_22rem),linear-gradient(120deg,hsl(var(--background)_/_0.15),hsl(var(--background)_/_0.84))]" />
      <div className="absolute -left-24 top-1/4 h-64 w-64 rounded-full border border-accent/20 bg-accent/5 blur-2xl" />

      <section className="relative z-10 grid min-h-dvh w-full grid-cols-[minmax(28rem,0.82fr)_minmax(0,1.18fr)] max-lg:grid-cols-1">
        <div className="relative z-10 flex min-h-dvh flex-col justify-between border-r border-white/10 bg-card/10 px-[clamp(1.5rem,4vw,5rem)] py-[clamp(1.25rem,3vw,3rem)] backdrop-blur-2xl max-lg:border-r-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">{t("app.eyebrow")}</p>
              <h1 className="mt-2 text-2xl font-black uppercase tracking-normal">{t("app.title")}</h1>
            </div>
            <div className="flex rounded-sm border border-white/10 bg-background p-1" aria-label={t("app.languageToggle")}>
              <Button className="h-7 min-w-10 px-2" onClick={() => setLanguage("el")} size="sm" type="button" variant={language === "el" ? "default" : "ghost"}>
                EL
              </Button>
              <Button className="h-7 min-w-10 px-2" onClick={() => setLanguage("en")} size="sm" type="button" variant={language === "en" ? "default" : "ghost"}>
                EN
              </Button>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-[26rem] gap-6 py-8">
            <div className="grid gap-4 text-center">
              <h2 className="text-2xl font-black uppercase leading-none tracking-normal">{isLogin ? t("auth.loginTitle") : t("auth.signupTitle")}</h2>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--accent)_/_0.55)] to-transparent" />
            </div>

            {!auth.configured && (
              <div className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-xs leading-5 text-white/75">{t("auth.notConfigured")}</div>
            )}

            <div className="grid gap-4">
              <Button
                className="h-10 w-full border-white/15 bg-white text-black hover:border-accent/70 hover:bg-white hover:text-black"
                disabled={busy || oauthBusy || !auth.configured}
                onClick={handleGoogleSignIn}
                type="button"
                variant="outline"
              >
                {oauthBusy ? <Loader2 className="animate-spin" size={14} /> : <GoogleMark />}
                {t("auth.continueWithGoogle")}
              </Button>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                <span className="h-px bg-white/10" />
                <span>{t("auth.oauthDivider")}</span>
                <span className="h-px bg-white/10" />
              </div>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                  <Label className="grid gap-2">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/55">{t("auth.firstName")}</span>
                    <Input autoComplete="given-name" onChange={(event) => setFirstName(event.target.value)} required type="text" value={firstName} />
                  </Label>
                  <Label className="grid gap-2">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/55">{t("auth.lastName")}</span>
                    <Input autoComplete="family-name" onChange={(event) => setLastName(event.target.value)} required type="text" value={lastName} />
                  </Label>
                </div>
              )}

              <Label className="grid gap-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/55">{t("auth.email")}</span>
                <Input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
              </Label>

              <PasswordField autoComplete={isLogin ? "current-password" : "new-password"} label={t("auth.password")} onChange={setPassword} value={password} />

              {!isLogin && (
                <>
                  <PasswordField autoComplete="new-password" label={t("auth.repeatPassword")} onChange={setPasswordRepeat} value={passwordRepeat} />
                  <div className="grid gap-2 rounded-sm border border-white/10 bg-black/20 p-3">
                    {rules.map((rule) => (
                      <div className={cn("flex items-center gap-2 text-[11px]", rule.valid ? "text-accent" : "text-white/40")} key={rule.label}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", rule.valid ? "bg-accent" : "bg-white/25")} />
                        {rule.label}
                      </div>
                    ))}
                    <div className={cn("flex items-center gap-2 text-[11px]", passwordsMatch ? "text-accent" : "text-white/40")}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", passwordsMatch ? "bg-accent" : "bg-white/25")} />
                      {t("auth.passwordRuleMatch")}
                    </div>
                  </div>
                </>
              )}

              {message && <p className="rounded-sm border border-accent/30 bg-accent/10 p-3 text-xs leading-5 text-accent">{message}</p>}
              {error && <p className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-xs leading-5 text-white/80">{error}</p>}

              <Button className="mt-1 w-full" disabled={busy || !auth.configured} type="submit" variant="default">
                {busy && <Loader2 className="animate-spin" size={14} />}
                {isLogin ? t("auth.login") : t("auth.signup")}
              </Button>
            </form>

            <Button asChild className="justify-center" variant="ghost">
              <Link to={`${isLogin ? "/signup" : "/login"}?next=${encodeURIComponent(next)}`}>
                {isLogin ? t("auth.switchToSignup") : t("auth.switchToLogin")}
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            <ShieldCheck size={13} className="shrink-0 text-accent" />
            <span>{t("auth.footerNote")}</span>
          </div>
          <LegalFooter className="mt-4" compact t={t} />
        </div>

        <div className="relative min-h-dvh overflow-hidden max-lg:hidden">
          <div className="absolute right-16 top-20 h-px w-2/3 bg-gradient-to-l from-[hsl(var(--accent)_/_0.5)] via-white/20 to-transparent" />
          <p className="absolute right-16 top-22 max-w-xs text-right text-xs font-semibold uppercase leading-5 tracking-[0.18em] text-white/62">
            {t("auth.visualTopNote")}
          </p>
          <div className="absolute bottom-28 left-16 h-px w-2/3 bg-gradient-to-r from-[hsl(var(--accent)_/_0.5)] via-white/20 to-transparent" />

          <div className="absolute bottom-[12%] left-16 right-[12%] max-w-2xl">
            <p className="text-5xl font-black uppercase leading-[0.9] tracking-normal text-white drop-shadow-2xl">{t("auth.visualTitle")}</p>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/68 drop-shadow-xl">{t("auth.visualSubtitle")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
