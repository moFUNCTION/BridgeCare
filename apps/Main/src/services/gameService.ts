import { Client, Databases, ID, Query } from "appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, databases } from "../lib/appwrite";

export interface AttentionTelemetry {
  reactionTimes: number[];
  commissionErrors: number; // Distractor clicks (impulsive)
  omissionErrors: number;   // Missed gold targets
  switchCosts: number[];    // Latency spikes following rule switches
  totalTargets: number;
  totalDistractors: number;
  durationMs: number;
}

export interface MoodTelemetry {
  valenceBias: number;             // 0 to 1 (preference for darker/withdrawn themes)
  hesitationOnPositiveMs: number; // Latency before selecting optimistic options (anhedonia marker)
  volatilityIndex: number;         // 1 to 10 variance in energy ratings
  choiceLatencies: number[];
  completedScenarios: number;
  durationMs: number;
}

export interface PatternTelemetry {
  checkingFrequency: number;        // Repeated clicks on already aligned or locked tiles
  intoleranceToAsymmetryMs: number; // Milliseconds spent manipulating intentionally unfixable tiles
  exitHesitationMs: number;         // Milliseconds hesitating before submitting imperfect pattern
  totalTileInteractions: number;
  symmetryAttempts: number;
  durationMs: number;
}

export interface EraTelemetry {
  answers: number[];
  totalScore: number;
  maxScore: number;
  completionTimeMs: number;
}

export interface GameTelemetry {
  reactionTimes?: number[];
  errors?: number;
  switches?: number;
  durationMs?: number;
  attention?: AttentionTelemetry;
  mood?: MoodTelemetry;
  pattern?: PatternTelemetry;
  era?: EraTelemetry;
  [key: string]: any;
}

export interface ScreeningResult {
  scoreId: string;
  userId: string;
  gameType: "attention" | "mood" | "pattern" | "era";
  scoreNumerator: number;
  scoreDenominator: number;
  telemetryMetrics: string;
  interpretationKey?: string;
  completedAt: string;
  attachedToDossier?: boolean;
}

/**
 * Mathematical scoring for Attention & Hyperactivity (ADHD)
 * Formula based on response time variability (sigma_RT), impulse clicks, and switch delay.
 */
export function computeAttentionScore(telemetry: AttentionTelemetry): number {
  if (!telemetry.reactionTimes || telemetry.reactionTimes.length === 0) {
    return 5;
  }

  // Mean Reaction Time
  const n = telemetry.reactionTimes.length;
  const meanRt = telemetry.reactionTimes.reduce((a, b) => a + b, 0) / n;

  // Standard Deviation of Reaction Time (variance indicates attention lapses)
  const variance = telemetry.reactionTimes.reduce((acc, rt) => acc + Math.pow(rt - meanRt, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Impulse errors ratio (commission clicks on distractors)
  const distractorCount = Math.max(1, telemetry.totalDistractors);
  const impulseRatio = Math.min(1.5, telemetry.commissionErrors / distractorCount);

  // Rule switch cost (ms delay after rule inversion)
  const meanSwitchCost = telemetry.switchCosts && telemetry.switchCosts.length > 0
    ? telemetry.switchCosts.reduce((a, b) => a + b, 0) / telemetry.switchCosts.length
    : 180;

  // Architecture Formula:
  // Score = round(10 * (0.35 * (sigma_RT / 250) + 0.35 * (Errors_impulse / N_distractors) + 0.30 * (SwitchCost / 400)))
  const rawScore = 10 * (
    (0.35 * Math.min(1.5, stdDev / 250)) +
    (0.35 * Math.min(1.5, impulseRatio)) +
    (0.30 * Math.min(1.5, meanSwitchCost / 400))
  );

  return Math.min(10, Math.max(1, Math.round(rawScore)));
}

/**
 * Mathematical scoring for Mood & Energy Fluctuation (Bipolar / Depressive spectrum)
 * Evaluates valence choices, hesitation on positive scenarios, and energy volatility.
 */
export function computeMoodScore(telemetry: MoodTelemetry): number {
  const hesitationFactor = Math.min(1.5, (telemetry.hesitationOnPositiveMs || 1000) / 3200);
  const volatilityFactor = Math.min(1.5, (telemetry.volatilityIndex || 3) / 8);
  const valenceFactor = Math.min(1.2, telemetry.valenceBias || 0.5);

  const raw = 10 * (
    (0.40 * volatilityFactor) +
    (0.35 * hesitationFactor) +
    (0.25 * valenceFactor)
  );

  return Math.min(10, Math.max(1, Math.round(raw)));
}

/**
 * Mathematical scoring for Pattern & Checking Compulsions (OCD)
 * Measures repeated re-checking, intolerance of unfixable asymmetry, and exit latency.
 */
export function computePatternScore(telemetry: PatternTelemetry): number {
  const checkFactor = Math.min(1.5, (telemetry.checkingFrequency || 0) / 7);
  const asymmetryFactor = Math.min(1.5, (telemetry.intoleranceToAsymmetryMs || 0) / 12000);
  const exitFactor = Math.min(1.5, (telemetry.exitHesitationMs || 0) / 8000);

  const raw = 10 * (
    (0.45 * checkFactor) +
    (0.35 * asymmetryFactor) +
    (0.20 * exitFactor)
  );

  return Math.min(10, Math.max(1, Math.round(raw)));
}

/**
 * General unified score computation dispatcher
 */
export function computeScore(telemetry: GameTelemetry, gameType: "attention" | "mood" | "pattern" | "era"): number {
  if (gameType === "attention") {
    if (telemetry.attention) {
      return computeAttentionScore(telemetry.attention);
    }
    // Fallback if flat telemetry was passed
    const reactionTimes = telemetry.reactionTimes || [];
    const errors = telemetry.errors || 0;
    const avgRt = reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      : 350;
    const raw = (errors * 1.5) + (avgRt > 400 ? 3 : 1);
    return Math.min(10, Math.max(1, Math.round(raw)));
  }

  if (gameType === "mood") {
    if (telemetry.mood) {
      return computeMoodScore(telemetry.mood);
    }
    return 6;
  }

  if (gameType === "pattern") {
    if (telemetry.pattern) {
      return computePatternScore(telemetry.pattern);
    }
    return 3;
  }

  if (gameType === "era" && telemetry.era) {
    return Math.min(10, Math.max(1, Math.round((telemetry.era.totalScore / telemetry.era.maxScore) * 10)));
  }

  return 5;
}

/**
 * Score interpretation providing warm, stigma-free explanations and clinical alignment
 */
export function getScoreInterpretation(
  gameType: "attention" | "mood" | "pattern" | "era",
  score: number,
  isArabic = false
) {
  if (gameType === "attention") {
    if (score >= 7) {
      return {
        tag: isArabic ? "مؤشر مرتفع للتركيز والانتباه" : "Elevated Focus & Activity Indicator",
        description: isArabic
          ? "تُظهر القياسات الحركية سرعة استجابة متباينة مع حساسية ملحوظة للمشتتات الخارجية ونبضات التبديل، وهو نمط معرفي شائع لدى أصحاب طيف فرط الحركة وتشتت الانتباه (ADHD)."
          : "Reaction telemetry indicates marked variance in response latency, elevated sensitivity to peripheral distractors, and rapid impulsive responsiveness—cognitive patterns frequently observed in ADHD.",
        specialty: "ADHD",
      };
    }
    if (score >= 4) {
      return {
        tag: isArabic ? "مؤشر متوسط لثبات الانتباه" : "Moderate Focus Stability",
        description: isArabic
          ? "تُشير النتائج إلى قدرة مقبولة على المحافظة على التركيز مع انزلاقات لحظية بسيطة عند مواجهة المشتتات."
          : "Results indicate moderate attentional focus with transient susceptibility to peripheral distraction under prolonged cognitive load.",
        specialty: "ADHD",
      };
    }
    return {
      tag: isArabic ? "ثبات معرفي متوازن" : "Balanced Cognitive Stability",
      description: isArabic
        ? "أظهرت استجاباتك استقراراً وتناغماً عالياً مع مقاومة ممتازة للمشتتات المحيطية وسرعة تحويل القواعد."
        : "Your responses demonstrate high reaction time consistency with strong resistance to distractors and smooth cognitive switching.",
      specialty: "ADHD",
    };
  }

  if (gameType === "mood") {
    if (score >= 7) {
      return {
        tag: isArabic ? "تقلبات ملحوظة في الطاقة والمزاج" : "Elevated Mood & Energy Volatility",
        description: isArabic
          ? "تعكس اختيارات السيناريوهات تذبذباً حركياً بين درجات الحيوية وتأخيراً طفيفاً في التفاعل مع المواقف الإيجابية، ما يشير إلى حساسية وجدانية تستحق المناقشة مع المختص."
          : "Scenario choices demonstrate broad energy swings and hesitation when processing positive stimuli, a behavioral pattern associated with mood spectrum sensitivity.",
        specialty: "Mood & Bipolar",
      };
    }
    return {
      tag: isArabic ? "توازن انفعالي ومرونة شعورية" : "Resilient Emotional Balance",
      description: isArabic
        ? "تظهر النتائج قدرة جيدة على التكيف الشعوري مع استقرار نسبي في تقييم الطاقة والحيوية النفسية."
        : "Results demonstrate steady emotional regulation and adaptive energy calibration across changing contextual scenarios.",
      specialty: "Depression & Anxiety",
    };
  }

  if (gameType === "pattern") {
    if (score >= 7) {
      return {
        tag: isArabic ? "ميل مرتفع للتدقيق والنمطية (وسواس)" : "Elevated Pattern & Checking Traits",
        description: isArabic
          ? "سجلت اللعبة تكراراً في مراجعة الأشكال المستقرة وصعوبة في تجاوز عدم التناظر، وهو مؤشر على نزعة تدقيق نمطية متكررة (سمات الوسواس القهري OCD)."
          : "Interactions indicate repeated verification of already locked patterns and a prolonged effort to fix irreversible asymmetries—traits indicative of checking compulsions.",
        specialty: "OCD",
      };
    }
    return {
      tag: isArabic ? "مرونة وتقبل لعدم التناظر" : "High Uncertainty Tolerance",
      description: isArabic
        ? "أظهرت تفاعلاتك مرونة عالية وتقبلاً سريعاً لعدم الكمال دون الحاجة إلى التكرار المفرط أو التحقق القهري."
        : "Low checking frequency and healthy tolerance for visual imperfection, reflecting high psychological flexibility.",
      specialty: "General Wellness",
    };
  }

  // ERA
  return {
    tag: score >= 7
      ? (isArabic ? "حساسية حسية وجسدية مرتفعة" : "Elevated Somatic Anxiety Load")
      : (isArabic ? "استجابة جسدية متوازنة" : "Balanced Somatic Reactivity"),
    description: score >= 7
      ? (isArabic
          ? "تشير إجاباتك إلى استجابات جسدية وحسية مرتفعة تحت الضغوط المفاجئة تستدعي إدراجها ضمن ملفك الطبي الجاهز للطبيب."
          : "Responses indicate heightened physiological and sensory reactivity to unexpected stressors, recommended for clinical review.")
      : (isArabic
          ? "معدلات استجابة متزنة للتوتر والحمولة الحسية اليومية."
          : "Balanced emotional and somatic regulation under daily sensory demands."),
    specialty: "Anxiety",
  };
}

/**
 * Save screening score into Appwrite `SCREENING_SCORES` with fallback to localStorage
 */
export async function saveScreeningScore(
  userId: string,
  gameType: "attention" | "mood" | "pattern" | "era",
  scoreNumerator: number,
  telemetry: any,
  interpretationKey?: string
): Promise<ScreeningResult> {
  const resultId = ID.unique();
  const timestamp = new Date().toISOString();
  const payload: ScreeningResult = {
    scoreId: resultId,
    userId: userId || "guest_patient",
    gameType,
    scoreNumerator,
    scoreDenominator: 10,
    telemetryMetrics: JSON.stringify(telemetry),
    interpretationKey: interpretationKey || `${gameType}_${scoreNumerator}_10`,
    completedAt: timestamp,
    attachedToDossier: true,
  };

  // 1. Always sync to localStorage cache
  try {
    const rawLocal = localStorage.getItem("bridgecare_screening_scores");
    const localList: ScreeningResult[] = rawLocal ? JSON.parse(rawLocal) : [];
    localList.unshift(payload);
    // Keep last 20 scores
    localStorage.setItem("bridgecare_screening_scores", JSON.stringify(localList.slice(0, 20)));
  } catch (storageErr) {
    console.warn("Local storage cache write error:", storageErr);
  }

  // 2. Persist to Appwrite database
  try {
    const doc = await databases.createDocument(
      "main",
      "SCREENING_SCORES",
      resultId,
      {
        scoreId: resultId,
        userId: payload.userId,
        gameType: payload.gameType,
        scoreNumerator: payload.scoreNumerator,
        scoreDenominator: 10,
        telemetryMetrics: payload.telemetryMetrics,
        interpretationKey: payload.interpretationKey,
        completedAt: payload.completedAt,
      }
    );
    return {
      ...payload,
      scoreId: doc.$id || resultId,
    };
  } catch (dbErr) {
    console.warn("Appwrite SCREENING_SCORES persistence note (cached locally):", dbErr);
    return payload;
  }
}

/**
 * Backwards-compatible persistGameResult matching Agent 3 Plan Phase 1 specification
 */
export async function persistGameResult(
  userId: string,
  gameType: string,
  score: number,
  telemetry: GameTelemetry
) {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);
  const db = new Databases(client);

  try {
    return await db.createDocument("main", "SCREENING_SCORES", ID.unique(), {
      scoreId: ID.unique(),
      userId: userId || "guest_patient",
      gameType,
      scoreNumerator: score,
      scoreDenominator: 10,
      telemetryMetrics: JSON.stringify(telemetry),
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Direct db createDocument fallback:", err);
    return saveScreeningScore(userId, gameType as any, score, telemetry);
  }
}

/**
 * Retrieve recent screening scores for a user (from Appwrite or local cache)
 */
export async function getRecentScreeningScores(userId?: string): Promise<Record<string, number>> {
  const scores: Record<string, number> = {
    attention: 7,
    mood: 6,
    pattern: 3,
    era: 6,
  };

  // Try Appwrite if user is provided
  if (userId) {
    try {
      const response = await databases.listDocuments("main", "SCREENING_SCORES", [
        Query.equal("userId", userId),
        Query.orderDesc("completedAt"),
        Query.limit(10),
      ]);
      if (response && response.documents && response.documents.length > 0) {
        response.documents.forEach((doc: any) => {
          if (doc.gameType && doc.scoreNumerator !== undefined && !scores[`user_${doc.gameType}`]) {
            scores[doc.gameType] = Number(doc.scoreNumerator);
            scores[`user_${doc.gameType}`] = 1;
          }
        });
        return scores;
      }
    } catch (err) {
      // Gracefully fall through to localStorage
    }
  }

  // Fallback to local storage
  try {
    const rawLocal = localStorage.getItem("bridgecare_screening_scores");
    if (rawLocal) {
      const localList: ScreeningResult[] = JSON.parse(rawLocal);
      localList.forEach((item) => {
        if (item.gameType && item.scoreNumerator !== undefined && !scores[`user_${item.gameType}`]) {
          scores[item.gameType] = item.scoreNumerator;
          scores[`user_${item.gameType}`] = 1;
        }
      });
    }
  } catch (e) {
    // ignore
  }

  return scores;
}

/**
 * Save preference: attach scores to doctor clinical file
 */
export function setDoctorFileAttachmentPreference(attached: boolean) {
  try {
    localStorage.setItem("bridgecare_attach_screening_to_doctor", attached ? "true" : "false");
  } catch (e) {
    // ignore
  }
}

export function getDoctorFileAttachmentPreference(): boolean {
  try {
    const val = localStorage.getItem("bridgecare_attach_screening_to_doctor");
    return val !== "false"; // default true
  } catch (e) {
    return true;
  }
}

// -------------------------------------------------------------
// Web Audio API Synthesizer (No external asset dependencies)
// -------------------------------------------------------------

class WebAudioHaptics {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * High-pitch golden star chime (pentatonic chime)
   */
  playStarChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio autoplay policy catch
    }
  }

  /**
   * Distractor soft buzz/thud
   */
  playDistractorBuzz() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Audio autoplay policy catch
    }
  }

  /**
   * Dual-tone rule switch cue
   */
  playSwitchCue() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [520, 780].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch {
      // Audio policy catch
    }
  }

  /**
   * Soft geometric tile click / slide
   */
  playTileClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio policy catch
    }
  }

  /**
   * Ambient weather chime for scenario transitions
   */
  playAtmosphericChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.06;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch {
      // Audio policy catch
    }
  }

  /**
   * Fanfare chord for scorecard display
   */
  playScorecardFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.09;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch {
      // Audio policy catch
    }
  }
}

export const gameAudio = new WebAudioHaptics();
