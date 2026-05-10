const configuredContactEmail = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim();

export const CONTACT_EMAIL = configuredContactEmail || "support@videosubtitletool.com";

export function contactHref(subject?: string) {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${CONTACT_EMAIL}${query}`;
}

export function dataRequestHref(subject: string, body: string) {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
