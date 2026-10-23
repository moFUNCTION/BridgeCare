import type { Locale } from "../locale";
import { resolveLocale } from "../locale";

export interface CourseTitleAnalysis {
  score: number;
  engagement: string;
  feedback: string[];
  strengths: string[];
  improvements: string[];
}

const POWER_WORDS = [
  "master", "essential", "ultimate", "complete", "advanced", "practical",
  "professional", "expert", "comprehensive", "proven", "secret", "exclusive",
  "breakthrough", "revolutionary", "innovative", "step-by-step", "quick", "easy",
  "powerful", "effective", "intensive", "premium", "top-rated",
  "شامل", "احترافي", "نهائي", "كامل", "مكثف", "مميز", "رائع", "سريع", "قوي", "فعال",
  "متقدم", "المطلق", "الكامل", "سر", "حصري", "ابتكاري", "ثوري",
  "تحفة", "خطير", "فشيخ", "جامد", "مفيش زيه", "مولع", "زي الفل", "هيغير حياتك", "هيظبطك", "هيخليك محترف",
];

const PROBLEM_SOLVING = [
  "solution", "fix", "resolve", "overcome", "improve", "boost", "enhance",
  "optimize", "maximize", "transform", "trick",
  "حل", "علاج", "إصلاح", "تطوير", "تحسين", "تقوية", "زيادة", "رفع المستوى", "تحويل", "تسهيل",
  "هيحل", "هيظبط", "هيساعدك", "هيريحك", "هيسهل عليك", "هيخليك فاهم",
];

const THANAWYA = [
  "ثانوية عامة", "امتحان", "امتحانات", "مراجعة", "مراجعات", "حل", "حلول",
  "تجميع", "تجميعات", "ملخص", "ملخصات", "بوكليت", "بوكليتات", "بابل شيت",
  "اسئلة", "اسئلة متوقعة", "متوقعة", "نموذج", "نماذج", "وزارة", "وزاري",
  "اخبار الامتحانات", "توقعات", "مكثف", "مكثفات", "ترم", "الفصل الدراسي",
  "شرح", "مسائل", "المتوقعة", "اللي هتيجي", "هتخش الامتحان", "اهم الاسئلة",
  "امتحان السنة اللي فاتت", "الدحيحة", "نظام جديد",
];

const AUDIENCE = [
  "beginners", "advanced", "professionals", "students", "kids", "adults",
  "مبتدئين", "متقدمين", "طلاب", "معلمين", "مدرسين", "أولياء الأمور",
  "ولاد", "بنات", "ثانوي", "اعدادي", "ابتدائي", "دفعة",
];

const ACTION = [
  "how to", "learn", "build", "create", "develop", "master", "understand", "pass", "ace",
  "كيف", "تعلم", "ابني", "انشئ", "طور", "اتقن", "افهم", "نجح", "تفوق",
  "ازاي", "هتتعلم", "هتفهم", "هتنجح", "هتعدي", "هتحل",
];

const CERTIFICATION = [
  "certification", "certified", "official", "معتمد", "شهادة", "معتمدة", "رسمي",
];

const TEXTS = {
  ar: {
    emptyTitle: "العنوان فارغ أو غير صالح",
    weak: "❌ ضعيف",
    titleTooShort: "العنوان قصير جدًا - خليه أوضح من 5 لـ 10 كلمات",
    titleTooLong: "العنوان طويل زيادة - قصّره شوية عشان يبقى سهل الحفظ",
    titleLengthGood: "طول العنوان ممتاز",
    powerWords: (words: string) => `كلمات تحفيزية قوية: ${words}`,
    addPowerWords: (words: string) => `ضيف كلمات جذابة زي: ${words}`,
    problemSolving: "بيعالج مشكلة أو بيطور حاجة",
    hasNumbers: "فيه أرقام محددة - ده بيزود المصداقية",
    actionVerbs: "فيه أفعال عملية بتحفّز المشاهد",
    targetAudience: "واضح مين الفئة المستهدفة",
    addAudience: "حدد الفئة المستهدفة (مثلاً: طلاب، ثانوي، مبتدئين)",
    certification: "فيه إشارة لشهادة أو اعتماد رسمي",
    thanawya: "مناسب لموضوعات ثانوية عامة",
    addThanawya: "ضيف مصطلحات تخص الثانوية العامة لو الكورس موجه ليهم",
    engagementVeryHigh: "🔥 جذاب جدًا",
    engagementHigh: "👍 جذاب",
    engagementMid: "📝 متوسط الجاذبية",
    engagementLow: "⚠️ محتاج تحسين",
    engagementWeak: "❌ ضعيف",
    strengthsLabel: "\n✅ نقاط القوة:",
    improvementsLabel: "\n🛠 تحسينات مقترحة:",
  },
  en: {
    emptyTitle: "Title is empty or invalid.",
    weak: "❌ Weak",
    titleTooShort: "Title is too short – use about 5 to 10 words.",
    titleTooLong: "Title is too long – shorten it for easier recall.",
    titleLengthGood: "Title length is good.",
    powerWords: (words: string) => `Strong power words: ${words}`,
    addPowerWords: (words: string) => `Add catchy words like: ${words}`,
    problemSolving: "Addresses a problem or improves something.",
    hasNumbers: "Contains specific numbers – adds credibility.",
    actionVerbs: "Uses action verbs that motivate viewers.",
    targetAudience: "Target audience is clear.",
    addAudience: "Specify target audience (e.g. students, secondary, beginners).",
    certification: "Mentions certification or official recognition.",
    thanawya: "Suitable for Thanawya Amma topics.",
    addThanawya: "Add Thanawya-related terms if the course targets them.",
    engagementVeryHigh: "🔥 Very engaging",
    engagementHigh: "👍 Engaging",
    engagementMid: "📝 Moderately engaging",
    engagementLow: "⚠️ Needs improvement",
    engagementWeak: "❌ Weak",
    strengthsLabel: "\n✅ Strengths:",
    improvementsLabel: "\n🛠 Suggested improvements:",
  },
} as const;

function normalize(str: string): string {
  return str.toLowerCase().trim();
}

function findMatchingWords(title: string, list: readonly string[]): string[] {
  const normalizedTitle = normalize(title);
  return list.filter((word) => normalizedTitle.includes(normalize(word)));
}

export interface AnalyzeCourseTitleOptions {
  /** UI language for feedback and labels (default: "en"). */
  lang?: Locale | null;
}

/**
 * Analyzes a course title for engagement, strengths, and improvements.
 * Supports English and Arabic keywords.
 */
export function analyzeCourseTitle(
  title: string,
  options: AnalyzeCourseTitleOptions = {}
): CourseTitleAnalysis {
  const lang = resolveLocale(options.lang);
  const t = TEXTS[lang];

  const analysis: CourseTitleAnalysis = {
    score: 0,
    engagement: "",
    feedback: [],
    strengths: [],
    improvements: [],
  };

  if (!title || typeof title !== "string") {
    analysis.improvements.push(t.emptyTitle);
    analysis.engagement = t.weak;
    return analysis;
  }

  const wordCount = title.split(/\s+/).filter(Boolean).length;

  if (wordCount < 3) {
    analysis.improvements.push(t.titleTooShort);
    analysis.score -= 1;
  } else if (wordCount > 15) {
    analysis.improvements.push(t.titleTooLong);
    analysis.score -= 1;
  } else if (wordCount >= 5 && wordCount <= 10) {
    analysis.strengths.push(t.titleLengthGood);
    analysis.score += 2;
  }

  const usedPower = findMatchingWords(title, POWER_WORDS);
  const usedProblem = findMatchingWords(title, PROBLEM_SOLVING);
  const usedThanawya = findMatchingWords(title, THANAWYA);
  const usedAudience = findMatchingWords(title, AUDIENCE);
  const usedAction = findMatchingWords(title, ACTION);
  const usedCert = findMatchingWords(title, CERTIFICATION);

  if (usedPower.length > 0) {
    analysis.strengths.push(t.powerWords(usedPower.join(", ")));
    analysis.score += Math.min(usedPower.length, 5);
  } else {
    analysis.improvements.push(t.addPowerWords(POWER_WORDS.slice(0, 5).join(", ")));
  }

  if (usedProblem.length > 0) {
    analysis.strengths.push(t.problemSolving);
    analysis.score += 2;
  }

  if (/\d+/.test(title)) {
    analysis.strengths.push(t.hasNumbers);
    analysis.score += 1;
  }

  if (usedAction.length > 0) {
    analysis.strengths.push(t.actionVerbs);
    analysis.score += 2;
  }

  if (usedAudience.length > 0) {
    analysis.strengths.push(t.targetAudience);
    analysis.score += 2;
  } else {
    analysis.improvements.push(t.addAudience);
  }

  if (usedCert.length > 0) {
    analysis.strengths.push(t.certification);
    analysis.score += 2;
  }

  if (usedThanawya.length > 0) {
    analysis.strengths.push(t.thanawya);
    analysis.score += 3;
  } else {
    analysis.improvements.push(t.addThanawya);
  }

  analysis.score = Math.min(100, Math.max(0, analysis.score * 8));

  if (analysis.score >= 80) analysis.engagement = t.engagementVeryHigh;
  else if (analysis.score >= 60) analysis.engagement = t.engagementHigh;
  else if (analysis.score >= 40) analysis.engagement = t.engagementMid;
  else if (analysis.score >= 20) analysis.engagement = t.engagementLow;
  else analysis.engagement = t.engagementWeak;

  analysis.feedback = [
    `Engagement Score: ${analysis.score}/100 (${analysis.engagement})`,
    t.strengthsLabel,
    ...analysis.strengths.map((s) => `- ${s}`),
    t.improvementsLabel,
    ...analysis.improvements.map((i) => `- ${i}`),
  ];

  return analysis;
}
