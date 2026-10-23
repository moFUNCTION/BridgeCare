import type { Locale } from "../locale";
import { resolveLocale } from "../locale";

export type OrdinalLanguage = Locale;

const SPECIAL_EN: Record<number, string> = {
  1: "First", 2: "Second", 3: "Third", 4: "Fourth", 5: "Fifth",
  6: "Sixth", 7: "Seventh", 8: "Eighth", 9: "Ninth", 10: "Tenth",
  11: "Eleventh", 12: "Twelfth", 13: "Thirteenth", 14: "Fourteenth", 15: "Fifteenth",
  16: "Sixteenth", 17: "Seventeenth", 18: "Eighteenth", 19: "Nineteenth",
};

const TENS_EN: Record<number, string> = {
  20: "Twentieth", 30: "Thirtieth", 40: "Fortieth", 50: "Fiftieth",
  60: "Sixtieth", 70: "Seventieth", 80: "Eightieth", 90: "Ninetieth",
};

const SUFFIX_EN: Record<number, string> = {
  1: "First", 2: "Second", 3: "Third", 4: "Fourth", 5: "Fifth",
  6: "Sixth", 7: "Seventh", 8: "Eighth", 9: "Ninth",
};

const SPECIAL_AR: Record<number, string> = {
  1: "الأول", 2: "الثاني", 3: "الثالث", 4: "الرابع", 5: "الخامس",
  6: "السادس", 7: "السابع", 8: "الثامن", 9: "التاسع", 10: "العاشر",
  11: "الحادي عشر", 12: "الثاني عشر", 13: "الثالث عشر", 14: "الرابع عشر", 15: "الخامس عشر",
  16: "السادس عشر", 17: "السابع عشر", 18: "الثامن عشر", 19: "التاسع عشر", 20: "العشرون",
};

function englishOrdinalSuffix(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  const last = n % 10;
  switch (last) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

export interface NumberToOrdinalOptions {
  /** Output language (default: "en"). */
  lang?: Locale | null;
}

/**
 * Converts a number to its ordinal form in English or Arabic.
 */
export function numberToOrdinal(
  num: number,
  options: OrdinalLanguage | NumberToOrdinalOptions = "en"
): string {
  const lang = typeof options === "string" ? options : resolveLocale(options?.lang);
  const n = Math.floor(Number(num));
  if (!Number.isFinite(n) || n < 0) return String(num);

  if (lang === "en") {
    if (SPECIAL_EN[n] !== undefined) return SPECIAL_EN[n];
    if (TENS_EN[n] !== undefined) return TENS_EN[n];

    const lastDigit = n % 10;
    const tens = n - lastDigit;

    if (SUFFIX_EN[lastDigit] !== undefined) {
      const tensStr = TENS_EN[tens];
      if (tensStr) {
        const base = tensStr.replace("ieth", "y");
        return `${base}-${SUFFIX_EN[lastDigit]}`;
      }
      return SUFFIX_EN[lastDigit];
    }

    return englishOrdinalSuffix(n);
  }

  if (lang === "ar") {
    if (SPECIAL_AR[n] !== undefined) return SPECIAL_AR[n];
    if (n > 20 && n < 100) {
      const lastDigit = n % 10;
      const tens = Math.floor(n / 10);
      const lastPart = SPECIAL_AR[lastDigit] ?? String(lastDigit);
      const tensPart = tens === 2 ? "عشرون" : `${tens}ون`;
      return `${lastPart} و${tensPart}`;
    }
    return `${n} (ترتيب غير مدعوم)`;
  }

  return String(n);
}
