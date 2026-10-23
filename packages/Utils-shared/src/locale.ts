/**
 * Supported UI languages for utils and components.
 */
export type Locale = "ar" | "en";

export const DEFAULT_LOCALE: Locale = "en";

export function resolveLocale(lang?: Locale | null): Locale {
  return lang === "ar" || lang === "en" ? lang : DEFAULT_LOCALE;
}
