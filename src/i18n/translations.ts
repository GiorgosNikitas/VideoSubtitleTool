import { SubtitleLanguage } from "../lib/subtitles";
import { el } from "./el";
import { en } from "./en";

export type TranslationKey = keyof typeof en;
export type TranslationParams = Record<string, string | number>;
export type Translator = (key: TranslationKey, params?: TranslationParams) => string;
export type TranslationDictionary = Record<TranslationKey, string>;

export const translations: Record<SubtitleLanguage, TranslationDictionary> = {
  en,
  el,
};

export function createTranslator(locale: SubtitleLanguage): Translator {
  const dictionary = translations[locale];
  return (key, params = {}) =>
    dictionary[key].replace(/\{(\w+)\}/g, (_match, paramKey: string) =>
      params[paramKey] === undefined ? `{${paramKey}}` : String(params[paramKey]),
    );
}
