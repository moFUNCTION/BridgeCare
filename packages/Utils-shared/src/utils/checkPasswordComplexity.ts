import type { Locale } from "../locale";
import { resolveLocale } from "../locale";

export type FeedbackType = "positive" | "negative";

export interface PasswordFeedbackItem {
  message: string;
  type: FeedbackType;
}

export interface PasswordComplexityResult {
  score: number;
  level: string;
  feedback: PasswordFeedbackItem[];
}

export interface CheckPasswordComplexityOptions {
  /** UI language for messages and level label (default: "en"). */
  lang?: Locale | null;
}

const COMMON_PATTERNS = /^(123|abc|qwerty|password|admin|user|letmein|welcome|monkey|dragon)/i;

const TEXTS = {
  ar: {
    tooShort: "كلمة المرور قصيرة جدًا. الحد الأدنى 8 أحرف.",
    lengthGood: "طول كلمة المرور ممتاز!",
    addNumbers: "أضف أرقامًا لزيادة قوة كلمة المرور.",
    numbersGood: "استخدام جيد للأرقام!",
    addLowercase: "أضف حروفًا صغيرة (a-z).",
    addUppercase: "أضف حروفًا كبيرة (A-Z).",
    addSpecial: "أضف رموزًا خاصة لزيادة قوة كلمة المرور.",
    specialGood: "استخدام جيد للرموز الخاصة!",
    noRepeat: "تجنب تكرار نفس الحرف أكثر من مرة.",
    noCommon: "تجنب استخدام كلمات مرور شائعة مثل '123' أو 'password'.",
    levelVeryStrong: "قوية جدًا",
    levelStrong: "قوية",
    levelMedium: "متوسطة",
    levelWeak: "ضعيفة",
    levelVeryWeak: "ضعيفة جدًا",
  },
  en: {
    tooShort: "Password is too short. Minimum 8 characters.",
    lengthGood: "Password length is great!",
    addNumbers: "Add numbers to strengthen the password.",
    numbersGood: "Good use of numbers!",
    addLowercase: "Add lowercase letters (a-z).",
    addUppercase: "Add uppercase letters (A-Z).",
    addSpecial: "Add special characters to strengthen the password.",
    specialGood: "Good use of special characters!",
    noRepeat: "Avoid repeating the same character.",
    noCommon: "Avoid common passwords like '123' or 'password'.",
    levelVeryStrong: "Very strong",
    levelStrong: "Strong",
    levelMedium: "Medium",
    levelWeak: "Weak",
    levelVeryWeak: "Very weak",
  },
} as const;

/**
 * Checks password complexity and returns a score (0–10), level label, and feedback.
 */
export function checkPasswordComplexity(
  password: string = "",
  options: CheckPasswordComplexityOptions = {}
): PasswordComplexityResult {
  const lang = resolveLocale(options.lang);
  const t = TEXTS[lang];

  let score = 0;
  const feedback: PasswordFeedbackItem[] = [];

  const add = (message: string, type: FeedbackType) => {
    feedback.push({ message, type });
  };

  if (password.length < 8) {
    add(t.tooShort, "negative");
  } else {
    score += Math.min(2, Math.floor(password.length / 8));
    if (password.length >= 12) {
      add(t.lengthGood, "positive");
    }
  }

  const digitCount = password.match(/\d/g)?.length ?? 0;
  if (digitCount > 0) {
    score += 1;
    if (digitCount >= 2) {
      score += 1;
      add(t.numbersGood, "positive");
    }
  } else {
    add(t.addNumbers, "negative");
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    add(t.addLowercase, "negative");
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    add(t.addUppercase, "negative");
  }

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 2;
    add(t.specialGood, "positive");
  } else {
    add(t.addSpecial, "negative");
  }

  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    add(t.noRepeat, "negative");
  }

  if (COMMON_PATTERNS.test(password)) {
    score -= 2;
    add(t.noCommon, "negative");
  }

  const clampedScore = Math.max(0, Math.min(10, score));

  let level: string;
  if (clampedScore >= 8) level = t.levelVeryStrong;
  else if (clampedScore >= 6) level = t.levelStrong;
  else if (clampedScore >= 4) level = t.levelMedium;
  else if (clampedScore >= 2) level = t.levelWeak;
  else level = t.levelVeryWeak;

  return {
    score: clampedScore,
    level,
    feedback,
  };
}
