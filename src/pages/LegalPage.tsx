import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LegalFooter } from "../components/LegalFooter";
import { Button } from "../components/ui/button";
import { createTranslator } from "../i18n/translations";
import { contactHref, CONTACT_EMAIL } from "../lib/legal";
import { SubtitleLanguage } from "../lib/subtitles";

type LegalPageProps = {
  type: "privacy" | "terms";
};

type LegalSection = {
  title: string;
  body: string[];
};

type LegalCopy = {
  back: string;
  lastUpdated: string;
  title: string;
  subtitle: string;
  sections: LegalSection[];
};

const legalCopy: Record<SubtitleLanguage, Record<LegalPageProps["type"], LegalCopy>> = {
  en: {
    privacy: {
      title: "Privacy Policy",
      subtitle: "How Subtitle Studio handles account data, temporary uploads, credits, and transcription processing.",
      lastUpdated: "Last updated: May 10, 2026",
      back: "Back to app",
      sections: [
        {
          title: "Who we are",
          body: [
            `Subtitle Studio is a video captioning tool. For privacy or data requests, contact ${CONTACT_EMAIL}.`,
          ],
        },
        {
          title: "Data we collect",
          body: [
            "Account data such as email, first name, last name, authentication provider, and credit balance.",
            "Usage metadata such as transcription/export jobs, credit ledger entries, file duration, model choice, language choice, status, and timestamps.",
            "Uploaded video/audio files and generated subtitles while they are needed to transcribe, preview, or export a captioned video.",
            "Technical data such as IP address, browser data, server logs, and error logs needed for security and reliability.",
          ],
        },
        {
          title: "How we use data",
          body: [
            "To authenticate users, manage credits, process transcription requests, render exported videos, prevent abuse, debug failures, and improve reliability.",
            "Audio/video content may be sent to OpenAI API services for transcription. Google account data is used only for sign-in when you choose Google login.",
          ],
        },
        {
          title: "Third-party processors",
          body: [
            "Supabase is used for authentication and credit/usage records. OpenAI is used for speech-to-text processing. Google may be used for OAuth sign-in. Hosting and server logs may be processed by the deployment provider.",
          ],
        },
        {
          title: "Retention",
          body: [
            "Uploaded videos are intended to remain temporary and are not stored in the database. Account, credit, ledger, and usage metadata may be kept while your account exists or as needed for security, abuse prevention, accounting, or legal obligations.",
          ],
        },
        {
          title: "Your choices and rights",
          body: [
            "You can request access, correction, deletion, or export of your account data by contacting us. You can request account deletion or data deletion using the data deletion link in the footer.",
          ],
        },
        {
          title: "Children",
          body: ["The service is not directed to children under 13 and should not be used by children under 13."],
        },
      ],
    },
    terms: {
      title: "Terms of Service",
      subtitle: "Rules for using Subtitle Studio, credits, uploads, transcription, and exports.",
      lastUpdated: "Last updated: May 10, 2026",
      back: "Back to app",
      sections: [
        {
          title: "Eligibility and account use",
          body: [
            "You must be at least 13 years old to use the service. You are responsible for activity on your account and for keeping your login secure.",
          ],
        },
        {
          title: "Uploads and rights",
          body: [
            "You must own or have permission to upload, transcribe, caption, edit, and export the videos and audio you submit. Do not upload illegal, infringing, private, or harmful content.",
          ],
        },
        {
          title: "Credits and paid processing",
          body: [
            "Credits are used for transcription and may be charged by rounded-up audio minute. Export currently requires login but does not spend credits. Failed transcription jobs may be refunded when no usable result is produced.",
          ],
        },
        {
          title: "AI transcription and accuracy",
          body: [
            "Transcription may be processed by OpenAI API services. Captions can contain errors, especially with noise, multiple speakers, accents, names, or technical terms. You are responsible for reviewing captions before publishing.",
          ],
        },
        {
          title: "Temporary files and exports",
          body: [
            "Video files are intended to be temporary processing files, not permanent storage. You should keep your own copies of source and exported files.",
          ],
        },
        {
          title: "Acceptable use",
          body: [
            "Do not attempt to bypass authentication, credits, rate limits, security controls, or abuse-prevention systems. Do not use the service in a way that violates third-party rights or applicable law.",
          ],
        },
        {
          title: "Availability and changes",
          body: [
            "The service may change, pause, or stop at any time. Features may fail or be unavailable. Terms may be updated as the app evolves.",
          ],
        },
      ],
    },
  },
  el: {
    privacy: {
      title: "Πολιτική Απορρήτου",
      subtitle: "Πώς το Subtitle Studio χειρίζεται λογαριασμούς, προσωρινά uploads, credits και επεξεργασία απομαγνητοφώνησης.",
      lastUpdated: "Τελευταία ενημέρωση: 10 Μαΐου 2026",
      back: "Πίσω στην εφαρμογή",
      sections: [
        {
          title: "Ποιοι είμαστε",
          body: [`Το Subtitle Studio είναι εργαλείο υποτιτλισμού βίντεο. Για αιτήματα απορρήτου ή δεδομένων, επικοινωνήστε στο ${CONTACT_EMAIL}.`],
        },
        {
          title: "Δεδομένα που συλλέγουμε",
          body: [
            "Δεδομένα λογαριασμού όπως email, όνομα, επώνυμο, πάροχος σύνδεσης και υπόλοιπο credits.",
            "Μεταδεδομένα χρήσης όπως jobs απομαγνητοφώνησης/εξαγωγής, κινήσεις credits, διάρκεια αρχείου, μοντέλο, γλώσσα, κατάσταση και χρονικές σημάνσεις.",
            "Βίντεο/ήχο που ανεβάζετε και υπότιτλους που δημιουργούνται όσο χρειάζονται για απομαγνητοφώνηση, προεπισκόπηση ή εξαγωγή.",
            "Τεχνικά δεδομένα όπως IP, στοιχεία browser, server logs και error logs για ασφάλεια και αξιοπιστία.",
          ],
        },
        {
          title: "Πώς χρησιμοποιούμε τα δεδομένα",
          body: [
            "Για σύνδεση χρηστών, διαχείριση credits, απομαγνητοφώνηση, εξαγωγή βίντεο, αποτροπή κατάχρησης, διάγνωση σφαλμάτων και βελτίωση αξιοπιστίας.",
            "Περιεχόμενο ήχου/βίντεο μπορεί να αποστέλλεται στις υπηρεσίες OpenAI API για απομαγνητοφώνηση. Δεδομένα Google χρησιμοποιούνται μόνο για σύνδεση όταν επιλέγετε Google login.",
          ],
        },
        {
          title: "Τρίτοι πάροχοι",
          body: [
            "Το Supabase χρησιμοποιείται για σύνδεση και αρχεία credits/χρήσης. Το OpenAI χρησιμοποιείται για speech-to-text. Η Google μπορεί να χρησιμοποιείται για OAuth σύνδεση. Ο πάροχος hosting μπορεί να επεξεργάζεται logs.",
          ],
        },
        {
          title: "Διατήρηση",
          body: [
            "Τα βίντεο προορίζονται να μένουν προσωρινά και δεν αποθηκεύονται στη βάση δεδομένων. Δεδομένα λογαριασμού, credits, ledger και χρήση μπορεί να διατηρούνται όσο υπάρχει ο λογαριασμός ή όσο χρειάζεται για ασφάλεια, λογιστικούς ή νόμιμους λόγους.",
          ],
        },
        {
          title: "Επιλογές και δικαιώματα",
          body: [
            "Μπορείτε να ζητήσετε πρόσβαση, διόρθωση, διαγραφή ή εξαγωγή των δεδομένων λογαριασμού σας επικοινωνώντας μαζί μας. Για διαγραφή δεδομένων χρησιμοποιήστε τον σύνδεσμο διαγραφής στο footer.",
          ],
        },
        {
          title: "Παιδιά",
          body: ["Η υπηρεσία δεν απευθύνεται σε παιδιά κάτω των 13 ετών και δεν πρέπει να χρησιμοποιείται από παιδιά κάτω των 13."],
        },
      ],
    },
    terms: {
      title: "Όροι Χρήσης",
      subtitle: "Κανόνες χρήσης για το Subtitle Studio, τα credits, τα uploads, την απομαγνητοφώνηση και τις εξαγωγές.",
      lastUpdated: "Τελευταία ενημέρωση: 10 Μαΐου 2026",
      back: "Πίσω στην εφαρμογή",
      sections: [
        {
          title: "Ηλικία και λογαριασμός",
          body: ["Πρέπει να είστε τουλάχιστον 13 ετών. Είστε υπεύθυνοι για τη χρήση του λογαριασμού σας και την ασφάλεια της σύνδεσής σας."],
        },
        {
          title: "Uploads και δικαιώματα",
          body: [
            "Πρέπει να έχετε δικαίωμα να ανεβάζετε, απομαγνητοφωνείτε, υποτιτλίζετε, επεξεργάζεστε και εξάγετε τα βίντεο/ηχητικά που υποβάλλετε. Μην ανεβάζετε παράνομο, παραβιαστικό, ιδιωτικό ή επιβλαβές περιεχόμενο.",
          ],
        },
        {
          title: "Credits και επεξεργασία με κόστος",
          body: [
            "Τα credits χρησιμοποιούνται για απομαγνητοφώνηση και μπορεί να χρεώνονται ανά στρογγυλοποιημένο λεπτό ήχου. Η εξαγωγή απαιτεί σύνδεση αλλά στην τρέχουσα έκδοση δεν καταναλώνει credits. Αποτυχημένες απομαγνητοφωνήσεις μπορεί να επιστρέφουν credits όταν δεν παραχθεί χρήσιμο αποτέλεσμα.",
          ],
        },
        {
          title: "AI απομαγνητοφώνηση και ακρίβεια",
          body: [
            "Η απομαγνητοφώνηση μπορεί να επεξεργάζεται από υπηρεσίες OpenAI API. Οι υπότιτλοι μπορεί να περιέχουν λάθη, ειδικά με θόρυβο, πολλούς ομιλητές, προφορές, ονόματα ή τεχνικούς όρους. Είστε υπεύθυνοι για έλεγχο πριν από δημοσίευση.",
          ],
        },
        {
          title: "Προσωρινά αρχεία και εξαγωγές",
          body: [
            "Τα βίντεο προορίζονται ως προσωρινά αρχεία επεξεργασίας, όχι μόνιμη αποθήκευση. Κρατήστε δικά σας αντίγραφα των αρχικών και εξαγόμενων αρχείων.",
          ],
        },
        {
          title: "Αποδεκτή χρήση",
          body: [
            "Μην επιχειρείτε να παρακάμψετε σύνδεση, credits, όρια, μέτρα ασφαλείας ή συστήματα αποτροπής κατάχρησης. Μην χρησιμοποιείτε την υπηρεσία με τρόπο που παραβιάζει δικαιώματα τρίτων ή την ισχύουσα νομοθεσία.",
          ],
        },
        {
          title: "Διαθεσιμότητα και αλλαγές",
          body: ["Η υπηρεσία μπορεί να αλλάξει, να διακοπεί προσωρινά ή να σταματήσει. Οι λειτουργίες μπορεί να αποτύχουν ή να μην είναι διαθέσιμες. Οι όροι μπορεί να ενημερώνονται καθώς εξελίσσεται η εφαρμογή."],
        },
      ],
    },
  },
};

export function LegalPage({ type }: LegalPageProps) {
  const [language, setLanguage] = useState<SubtitleLanguage>("el");
  const t = useMemo(() => createTranslator(language), [language]);
  const copy = legalCopy[language][type];

  return (
    <div className="min-h-dvh bg-background font-mono text-foreground">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5 max-md:flex-col max-md:items-start max-md:px-4">
        <Button asChild size="sm" variant="ghost">
          <Link to="/">
            <ArrowLeft size={14} />
            {copy.back}
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{copy.lastUpdated}</p>
          <h1 className="text-4xl font-black uppercase leading-none tracking-normal max-md:text-3xl">{copy.title}</h1>
          <p className="max-w-2xl text-sm leading-7 text-white/62">{copy.subtitle}</p>
        </div>

        <div className="grid gap-5">
          {copy.sections.map((section) => (
            <section className="rounded-sm border border-white/10 bg-card/55 p-5" key={section.title}>
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-white">{section.title}</h2>
              <div className="mt-3 grid gap-2">
                {section.body.map((paragraph) => (
                  <p className="text-sm leading-7 text-white/62" key={paragraph}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="rounded-sm border border-accent/30 bg-accent/5 p-5 text-sm leading-7 text-white/70">
          {language === "el" ? "Για αιτήματα πρόσβασης, διόρθωσης ή διαγραφής δεδομένων: " : "For access, correction, or deletion requests: "}
          <a className="font-semibold text-accent hover:text-white" href={contactHref("Privacy request")}>
            {CONTACT_EMAIL}
          </a>
        </div>
      </main>

      <LegalFooter t={t} />
    </div>
  );
}
