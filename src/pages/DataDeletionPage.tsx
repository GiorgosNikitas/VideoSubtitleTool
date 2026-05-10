import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { LegalFooter } from "../components/LegalFooter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { createTranslator } from "../i18n/translations";
import { contactHref, CONTACT_EMAIL, dataRequestHref } from "../lib/legal";
import { SubtitleLanguage } from "../lib/subtitles";

type RequestType = "delete-account" | "delete-data" | "access-data";

const requestLabels: Record<SubtitleLanguage, Record<RequestType, string>> = {
  en: {
    "access-data": "Access or export my data",
    "delete-account": "Delete my account",
    "delete-data": "Delete my stored data",
  },
  el: {
    "access-data": "Πρόσβαση ή εξαγωγή δεδομένων",
    "delete-account": "Διαγραφή λογαριασμού",
    "delete-data": "Διαγραφή αποθηκευμένων δεδομένων",
  },
};

export function DataDeletionPage() {
  const [language, setLanguage] = useState<SubtitleLanguage>("el");
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("delete-account");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const t = useMemo(() => createTranslator(language), [language]);
  const labels = requestLabels[language];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = "Data deletion request";
    const body = [
      "Hello,",
      "",
      "I am requesting help with my Subtitle Studio data.",
      "",
      `Account email: ${email}`,
      `Request type: ${labels[requestType]}`,
      "",
      "Details:",
      details.trim() || "(No extra details provided.)",
      "",
      "Please confirm any identity verification steps needed to complete this request.",
    ].join("\n");

    setSubmitted(true);
    window.location.href = dataRequestHref(`${subject} - ${email}`, body);
  }

  return (
    <div className="min-h-dvh bg-background font-mono text-foreground">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5 max-md:flex-col max-md:items-start max-md:px-4">
        <Button asChild size="sm" variant="ghost">
          <Link to="/">
            <ArrowLeft size={14} />
            {language === "el" ? "Πίσω στην εφαρμογή" : "Back to app"}
          </Link>
        </Button>
        <div className="flex rounded-sm border border-white/10 bg-card p-1" aria-label={t("app.languageToggle")}>
          <Button className="h-7 min-w-10 px-2" onClick={() => setLanguage("el")} size="sm" type="button" variant={language === "el" ? "default" : "ghost"}>
            EL
          </Button>
          <Button className="h-7 min-w-10 px-2" onClick={() => setLanguage("en")} size="sm" type="button" variant={language === "en" ? "default" : "ghost"}>
            EN
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-8 px-6 py-12 max-md:px-4">
        <div className="grid gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {language === "el" ? "Αίτημα δεδομένων" : "Data request"}
          </p>
          <h1 className="text-4xl font-black uppercase leading-none tracking-normal max-md:text-3xl">
            {language === "el" ? "Διαγραφή δεδομένων" : "Data deletion"}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-white/62">
            {language === "el"
              ? "Στείλτε αίτημα για διαγραφή λογαριασμού, διαγραφή αποθηκευμένων δεδομένων ή πρόσβαση στα δεδομένα σας. Το βίντεο/ήχος προορίζεται να μένει προσωρινό και δεν αποθηκεύεται στη βάση δεδομένων."
              : "Request account deletion, deletion of stored data, or access to your data. Video/audio uploads are intended to stay temporary and are not stored in the database."}
          </p>
        </div>

        <section className="grid gap-5 rounded-sm border border-white/10 bg-card/55 p-5">
          <div className="grid gap-2">
            <h2 className="text-sm font-black uppercase tracking-[0.14em]">
              {language === "el" ? "Τι μπορεί να διαγραφεί" : "What can be deleted"}
            </h2>
            <p className="text-sm leading-7 text-white/62">
              {language === "el"
                ? "Μπορούμε να βοηθήσουμε με διαγραφή λογαριασμού, profile, usage metadata, credit ledger και άλλα αποθηκευμένα στοιχεία που συνδέονται με το email σας, όπου επιτρέπεται από νόμιμες ή λογιστικές υποχρεώσεις."
                : "We can help delete your account, profile, usage metadata, credit ledger, and other stored records linked to your email where allowed by legal or accounting obligations."}
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Label className="grid gap-2">
              <span>{language === "el" ? "Email λογαριασμού" : "Account email"}</span>
              <Input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            </Label>

            <Label className="grid gap-2">
              <span>{language === "el" ? "Τύπος αιτήματος" : "Request type"}</span>
              <select
                className="h-9 rounded-sm border border-white/10 bg-input px-3 text-sm text-white outline-none focus:ring-1 focus:ring-ring"
                onChange={(event) => setRequestType(event.target.value as RequestType)}
                value={requestType}
              >
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Label>

            <Label className="grid gap-2">
              <span>{language === "el" ? "Λεπτομέρειες" : "Details"}</span>
              <Textarea
                className="min-h-28 resize-y normal-case"
                onChange={(event) => setDetails(event.target.value)}
                placeholder={
                  language === "el"
                    ? "Προσθέστε ό,τι βοηθάει να εντοπίσουμε τον λογαριασμό σας."
                    : "Add anything that helps us identify your account."
                }
                value={details}
              />
            </Label>

            {submitted && (
              <div className="rounded-sm border border-accent/30 bg-accent/5 p-3 text-xs leading-5 text-white/70">
                {language === "el"
                  ? "Άνοιξε ο email client σας. Στείλτε το email για να ολοκληρωθεί το αίτημα."
                  : "Your email client has opened. Send the email to complete the request."}
              </div>
            )}

            <Button className="justify-center" type="submit">
              <Mail size={14} />
              {language === "el" ? "Δημιουργία email αιτήματος" : "Create request email"}
            </Button>
          </form>
        </section>

        <p className="text-sm leading-7 text-white/55">
          {language === "el" ? "Μπορείτε επίσης να στείλετε απευθείας email στο " : "You can also email us directly at "}
          <a className="font-semibold text-accent hover:text-white" href={contactHref("Data deletion request")}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </main>

      <LegalFooter t={t} />
    </div>
  );
}
