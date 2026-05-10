import { Link } from "react-router-dom";
import { type Translator } from "../i18n/translations";
import { contactHref, CONTACT_EMAIL } from "../lib/legal";
import { cn } from "../lib/utils";

type LegalFooterProps = {
  className?: string;
  compact?: boolean;
  t: Translator;
};

export function LegalFooter({ className, compact = false, t }: LegalFooterProps) {
  return (
    <footer
      className={cn(
        "relative z-10 border-t border-white/10 bg-background/85 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 backdrop-blur-xl max-md:px-3",
        compact && "border-t-0 bg-transparent px-0 py-0 backdrop-blur-0",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link className="transition-colors hover:text-accent" to="/privacy">
          {t("legal.privacy")}
        </Link>
        <Link className="transition-colors hover:text-accent" to="/terms">
          {t("legal.terms")}
        </Link>
        <Link className="transition-colors hover:text-accent" to="/data-deletion">
          {t("legal.dataDeletion")}
        </Link>
        <a className="normal-case tracking-normal transition-colors hover:text-accent" href={contactHref()}>
          {CONTACT_EMAIL}
        </a>
        <span>{t("legal.age")}</span>
      </div>
    </footer>
  );
}
