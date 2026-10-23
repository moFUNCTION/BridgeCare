import {
  parseISO,
  isValid,
  isToday,
  isThisWeek,
  formatDistanceToNow,
  format,
} from "date-fns";
import { ar } from "date-fns/locale";
import type { Locale } from "../locale";
import { resolveLocale } from "../locale";

export interface GetRelativeTimeOptions {
  /** UI language for formatted date (default: "en"). */
  lang?: Locale | null;
}

const dateFnsLocales = { ar, en: undefined } as const;

/**
 * Formats a date string (ISO or parseable) as relative time for today,
 * day name for this week, or full date otherwise.
 */
export function getRelativeTime(
  dateInput: string | Date,
  options: GetRelativeTimeOptions = {}
): string {
  const lang = resolveLocale(options.lang);
  const locale = dateFnsLocales[lang];

  const date =
    typeof dateInput === "string" ? parseISO(dateInput) : dateInput;

  if (!isValid(date)) {
    return String(dateInput);
  }

  const now = new Date();

  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true, locale: locale ?? undefined });
  }

  if (isThisWeek(date, { weekStartsOn: 0 })) {
    return format(date, "EEEE", { locale: locale ?? undefined });
  }

  return format(date, "MMMM d, yyyy", { locale: locale ?? undefined });
}
