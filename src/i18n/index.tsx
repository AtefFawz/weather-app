import { createContext, use, useMemo, type ReactNode } from "react";
import { intlLocale, type Locale } from "@/core/format";
import { ar } from "./ar";
import { en, type MessageKey } from "./en";

export type { MessageKey };
export type Params = Record<string, string | number>;
export type Translate = (key: MessageKey, params?: Params) => string;

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, ar };

/** Replaces `{name}` placeholders. Unknown placeholders are left visible so mistakes are noticed. */
export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

export function createTranslator(language: Locale): Translate {
  const dictionary = dictionaries[language];
  return (key, params) => interpolate(dictionary[key] ?? en[key], params);
}

export const directionFor = (language: Locale): "ltr" | "rtl" => (language === "ar" ? "rtl" : "ltr");

interface I18nValue {
  language: Locale;
  locale: string;
  dir: "ltr" | "rtl";
  t: Translate;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ language, children }: { language: Locale; children: ReactNode }) {
  const value = useMemo<I18nValue>(
    () => ({ language, locale: intlLocale(language), dir: directionFor(language), t: createTranslator(language) }),
    [language],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18nValue {
  const value = use(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
