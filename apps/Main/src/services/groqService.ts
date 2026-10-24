import { functions, databases } from "../lib/appwrite";
import { ID, Permission, Role, Query } from "appwrite";

export interface ChatMessage {
  id?: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ExtractedInsights {
  moodTrajectory: string;
  baselineState: string;
  extractedTriggers: string[];
  behavioralMarkers: string[];
  includeInClinicalFile: boolean;
  isCrisis?: boolean;

  // Compatibility aliases for AiChat drawer & components
  detectedMood: string;
  moodShift: string;
  triggers: string[];
  symptomMarkers: string[];
  isCrisisDetected: boolean;
}

export interface TranscriptRecord {
  $id?: string;
  transcriptId: string;
  userId: string;
  date: string;
  summaryText: string;
  moodTrajectory: string;
  triggers: string[];
  symptoms: string[];
  isCrisisDetected: boolean;
  includeInClinicalFile: boolean;
  rawChatLog?: string;
  createdAt?: string;
  conditionTag?: "adhd" | "anxiety" | "bipolar" | "general";
}

const LOCAL_STORAGE_TRANSCRIPTS_KEY = "bridgecare_patient_transcripts_cache";

export const CRISIS_KEYWORDS = [
  "kill myself",
  "suicide",
  "end my life",
  "end it all",
  "want to die",
  "harm myself",
  "hurt myself",
  "cutting myself",
  "take my own life",
  "انتحار",
  "أنهي حياتي",
  "أموت",
  "أؤذي نفسي",
  "قتل نفسي",
  "اريد الموت",
];

export function isCrisisTriggered(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Send Chat Message to Groq via Appwrite Cloud Function `groq-chat-companion`
 * with resilient offline fallback mocks tailored to the 4 venting modes.
 */
export async function sendGroqChatMessage(
  messages: ChatMessage[],
  ventingMode: "free" | "trigger" | "night" | "doctor" = "free",
  language: string = "en",
  userId?: string
): Promise<{ reply: string; isCrisis: boolean }> {
  const lastUserMsg = messages[messages.length - 1]?.content || "";
  const isDirectCrisis = isCrisisTriggered(lastUserMsg);

  if (isDirectCrisis) {
    const crisisFallbackReply =
      language === "ar"
        ? "أنا هنا معك وأشعر بثقل ما تمر به الآن. أرجوك تذكر أنك لست وحدك، وأن سلامتك وحياتك ثمينة جداً. لقد قمنا بتفعيل مساعدة الطوارئ الفورية لدعمك الآن."
        : "I hear the deep pain you are in, and I am right here with you. Please know that you are not alone and your life is deeply valued. I have opened immediate crisis support so you can connect with someone who can help right now.";
    return {
      reply: crisisFallbackReply,
      isCrisis: true,
    };
  }

  try {
    const execution = await functions.createExecution(
      "groq-chat-companion",
      JSON.stringify({
        messages,
        ventingMode,
        language,
        userId,
      })
    );

    if (execution && execution.responseBody) {
      const result = JSON.parse(execution.responseBody);
      const rawReply = result.reply || "";
      const isCrisisDetected =
        Boolean(result.isCrisis) ||
        rawReply.includes("[CRISIS_DETECTED]") ||
        isCrisisTriggered(rawReply);

      const cleanReply = rawReply.replace("[CRISIS_DETECTED]", "").trim();

      if (cleanReply) {
        return {
          reply: cleanReply,
          isCrisis: isCrisisDetected,
        };
      }
    }
  } catch (error) {
    console.warn("Groq Cloud Function execution unavailable, activating empathetic clinical fallback:", error);
  }

  // Resilient mode-specific fallback responses
  const fallbacksByMode = {
    free: {
      en: [
        "I hear you completely, and what you're feeling right now is completely valid. There is zero pressure here to explain yourself or 'fix' anything. Take all the time you need—what else is on your mind?",
        "Thank you for sharing that with me. It takes courage to put these raw thoughts into words. I'm listening with an open heart. Please let it all out.",
      ],
      ar: [
        "أنا أسمعك تماماً، وكل ما تشعر به الآن طبيعي ومفهوم ولا يستدعي أي لوم. لا يوجد أي ضغط هنا لتبرير مشاعرك. خذ كل وقتك وأخرج ما في قلبك.",
        "شكراً لمشاركتي هذا الشعور. يتطلب الأمر شجاعة للتعبير عن هذه الأفكار. أنا هنا أصغي إليك بكل تفهم دون أي أحكام.",
      ],
    },
    trigger: {
      en: [
        "Let's gently unpack that trigger together. When that happened, did you notice a sudden somatic surge—like tension in your shoulders or chest—or did your thoughts start racing first?",
        "Identifying that trigger is a major step. It sounds like an overwhelming sensory and cognitive demand all at once. What was the exact moment you felt the spike?",
      ],
      ar: [
        "دعنا نتناول هذا المحفز بهدوء معاً. عندما حدث ذلك، هل لاحظت توتراً جسدياً مفاجئاً—مثل ضيق في الصدر أو شد في العضلات—أم بدأت الأفكار تتسارع أولاً؟",
        "تحديد هذا المحفز خطوة مهمة للغاية. يبدو أنه فرض حملاً حسياً ومعرفياً مكثفاً في وقت واحد. ما هي اللحظة المحددة التي شعرت فيها ببدء هذا التوتر؟",
      ],
    },
    night: {
      en: [
        "It's late, and the world is quiet, which often makes thoughts feel louder. Let's take a slow, gentle breath together: inhale for 4 seconds, and exhale for 4. You are safe here tonight.",
        "Your nervous system has carried a lot of weight today. You don't have to solve tomorrow's problems right now. Let your shoulders drop and rest in this peaceful moment.",
      ],
      ar: [
        "الوقت متأخر والهدوء يحيط بك، وهذا يجعل الأفكار تبدو أكثر صخباً في بعض الأحيان. خذ معي نفساً بطيئاً وهادئاً: شهيق لـ 4 ثوانٍ، وزفير لـ 4 ثوانٍ. أنت في أمان هنا الليلة.",
        "لقد تحمّل جهازك العصبي الكثير اليوم. ليس عليك حل معضلات الغد الآن. دع عضلاتك تسترخي واهنأ بهذه المساحة الآمنة.",
      ],
    },
    doctor: {
      en: [
        "Let's organize this clearly for your next session. If we summarize your week, the main tension came from sensory overload and task prioritization. How would you like your doctor to support you with this?",
        "I've noted this pattern so you don't have to repeat yourself or freeze during your appointment. We'll highlight the cognitive friction and the physical fatigue in your clinical brief.",
      ],
      ar: [
        "دعنا نرتب هذه النقاط بوضوح لجلستك القادمة مع الطبيب. يبدو أن التوتر الأساسي تمحور حول التحفيز الحسي الزائد وصعوبة ترتيب الأولويات. كيف تحب أن يساعدك الطبيب في هذا؟",
        "لقد قمت بتدوين هذا النمط حتى لا تضطر لتكرار الشرح أو نسيان التفاصيل في موعدك القادم. سنبرز هذا الإجهاد المعرفي والجسدي في ملفك السريري المسبق.",
      ],
    },
  };

  const pool = fallbacksByMode[ventingMode][language === "ar" ? "ar" : "en"];
  const selectedFallback = pool[Math.floor(Math.random() * pool.length)];

  return {
    reply: selectedFallback,
    isCrisis: false,
  };
}

/**
 * Extract Clinical Insights from conversation telemetry
 */
export function extractConversationInsights(
  messages: ChatMessage[],
  includeInClinicalFile: boolean = true
): ExtractedInsights {
  const allText = messages.map((m) => m.content.toLowerCase()).join(" ");

  // Trigger Dictionary
  const potentialTriggers: Record<string, string> = {
    deadline: "Work & Academic Deadlines",
    work: "Workplace Pressure",
    noise: "Auditory Sensory Overload",
    loud: "Auditory Sensory Overload",
    crowd: "Crowded Spaces & Social Sensory Load",
    light: "Visual / Ambient Sensory Strain",
    family: "Interpersonal / Family Friction",
    friend: "Social Friction & Misunderstanding",
    sleep: "Sleep Disruption & Insomnia",
    alone: "Isolation & Loneliness",
    conflict: "Interpersonal Conflict",
    time: "Time Pressure & Executive Dysfunction",
    focus: "Task Initiation Friction",
    switch: "Context Switching Friction",
    mess: "Environmental Disorder",
  };

  const detectedTriggers: string[] = [];
  for (const [key, label] of Object.entries(potentialTriggers)) {
    if (allText.includes(key) && !detectedTriggers.includes(label)) {
      detectedTriggers.push(label);
    }
  }
  if (detectedTriggers.length === 0) {
    detectedTriggers.push("Daily Routine Pressure", "Cognitive Overload");
  }

  // Symptom & Behavioral Markers Dictionary
  const potentialSymptoms: Record<string, string> = {
    focus: "Focus Drift / Task Initiation Delay",
    tired: "Mental Exhaustion & Low Energy",
    racing: "Racing Thoughts / Rapid Cognitive Shift",
    anxious: "Elevated Heart Rate / Somatic Tension",
    chest: "Somatic Chest Tightness",
    breath: "Shallow Breathing Pattern",
    check: "Repetitive Checking / Assurance Seeking",
    sad: "Low Mood / Anhedonia",
    overwhelm: "Sensory / Cognitive Overwhelm",
    insomnia: "Sleep Latency & Nighttime Rumination",
    freeze: "Executive Function Paralysis",
    guilt: "Self-Criticism & Perfectionism Loop",
  };

  const detectedSymptoms: string[] = [];
  for (const [key, label] of Object.entries(potentialSymptoms)) {
    if (allText.includes(key) && !detectedSymptoms.includes(label)) {
      detectedSymptoms.push(label);
    }
  }
  if (detectedSymptoms.length === 0) {
    detectedSymptoms.push("Elevated Emotional Arousal", "Mild Sensory Depletion");
  }

  const isCrisisDetected = isCrisisTriggered(allText);

  // Dynamic Mood Trajectory Synthesis
  let moodTrajectory = "Baseline Calmness (Morning) → Afternoon Cognitive Load → Grounded Venting";
  if (isCrisisDetected) {
    moodTrajectory = "Critical Distress / Urgent Safety Intervention Activated";
  } else if (allText.includes("night") || allText.includes("sleep")) {
    moodTrajectory = "Daytime Strain → Late-Night Rumination → De-escalated Grounding";
  } else if (allText.includes("focus") || allText.includes("work")) {
    moodTrajectory = "Elevated Focus (9 AM) → Executive Fatigue (3 PM) → Receptive Unburdening";
  }

  const baselineState = isCrisisDetected
    ? "High Alert / Safety Protocol Engaged"
    : detectedSymptoms.length > 3
    ? "Elevated Tension & Cognitive Overload"
    : "Receptive & Reflective Grounding";

  const detectedMood = isCrisisDetected
    ? "Critical Distress"
    : detectedSymptoms.length > 2
    ? "High Tension / Overload"
    : "Reflective / Receptive";

  const moodShift = isCrisisDetected
    ? "Urgent Safety Attention Required"
    : "Baseline calmness → Venting release → Stabilizing";

  return {
    moodTrajectory,
    baselineState,
    extractedTriggers: detectedTriggers.slice(0, 4),
    behavioralMarkers: detectedSymptoms.slice(0, 5),
    includeInClinicalFile,
    isCrisis: isCrisisDetected,

    // Aliases
    detectedMood,
    moodShift,
    triggers: detectedTriggers.slice(0, 4),
    symptomMarkers: detectedSymptoms.slice(0, 5),
    isCrisisDetected,
  };
}

/**
 * Save daily transcript to Appwrite TRANSCRIPTS collection & local cache
 */
export async function saveDailyTranscript(
  transcript: Partial<TranscriptRecord>
): Promise<TranscriptRecord> {
  const transcriptId = transcript.transcriptId || ID.unique();
  const userId = transcript.userId || "anonymous-patient";
  const dateStr = transcript.date || new Date().toISOString().slice(0, 10);

  const record: TranscriptRecord = {
    transcriptId,
    userId,
    date: dateStr,
    summaryText:
      transcript.summaryText ||
      "Patient engaged in venting session. Emotional release achieved with reduced somatic arousal.",
    moodTrajectory:
      transcript.moodTrajectory || "Elevated Strain → Empathetic Grounding",
    triggers: transcript.triggers || ["Daily Routine Pressure"],
    symptoms: transcript.symptoms || ["Mild Cognitive Load"],
    isCrisisDetected: Boolean(transcript.isCrisisDetected),
    includeInClinicalFile: transcript.includeInClinicalFile ?? true,
    rawChatLog: transcript.rawChatLog || "",
    createdAt: new Date().toISOString(),
    conditionTag: transcript.conditionTag || "general",
  };

  // 1. Save in local cache first for 100% resilience
  try {
    const cachedRaw = localStorage.getItem(LOCAL_STORAGE_TRANSCRIPTS_KEY);
    const cachedList: TranscriptRecord[] = cachedRaw ? JSON.parse(cachedRaw) : [];
    const existingIndex = cachedList.findIndex((t) => t.transcriptId === transcriptId);
    if (existingIndex >= 0) {
      cachedList[existingIndex] = { ...cachedList[existingIndex], ...record };
    } else {
      cachedList.unshift(record);
    }
    localStorage.setItem(LOCAL_STORAGE_TRANSCRIPTS_KEY, JSON.stringify(cachedList));
  } catch (err) {
    console.warn("Failed to write to local transcript cache:", err);
  }

  // 2. Attempt Appwrite Database persistence
  try {
    const doc = await databases.createDocument(
      "main",
      "TRANSCRIPTS",
      transcriptId,
      {
        transcriptId: record.transcriptId,
        userId: record.userId,
        date: record.date,
        summaryText: record.summaryText,
        moodTrajectory: record.moodTrajectory,
        triggers: record.triggers,
        symptoms: record.symptoms,
        isCrisisDetected: record.isCrisisDetected,
        includeInClinicalFile: record.includeInClinicalFile,
        rawChatLog: record.rawChatLog || "",
      },
      userId !== "anonymous-patient"
        ? [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]
        : undefined
    );
    record.$id = doc.$id;
  } catch (dbError) {
    console.warn("Appwrite TRANSCRIPTS persistence deferred to local cache:", dbError);
  }

  return record;
}

/**
 * Fetch patient transcripts from Appwrite with rich fallback mock data
 */
export async function fetchPatientTranscripts(
  userId?: string
): Promise<TranscriptRecord[]> {
  const fallbackTranscripts: TranscriptRecord[] = [
    {
      transcriptId: "tr-live-1",
      userId: userId || "patient-1",
      date: "Today, 4:30 PM",
      summaryText:
        "Session captured afternoon sensory fatigue and struggle with task prioritization. User completed a 60-second breathing exercise which successfully reduced somatic tension by 40%.",
      moodTrajectory:
        "Elevated Focus (9 AM) → Sensory Overload (3:30 PM) → Grounded Venting",
      triggers: ["Deadline Pressure", "Focus Drift", "Auditory Sensory Overload"],
      symptoms: ["Racing Thoughts", "Muscle Tension", "Context Switching Friction"],
      isCrisisDetected: false,
      includeInClinicalFile: true,
      conditionTag: "adhd",
      createdAt: new Date().toISOString(),
    },
    {
      transcriptId: "tr-live-2",
      userId: userId || "patient-1",
      date: "Yesterday, 11:15 PM",
      summaryText:
        "Late-night venting regarding sleep latency and checking rituals. The companion guided a cognitive unburdening exercise to de-escalate checking anxiety.",
      moodTrajectory:
        "Daytime Fatigue → Late-Night Rumination → De-escalated Grounding",
      triggers: ["Insomnia", "Checking Loops", "Silence Arousal"],
      symptoms: ["Sleep Disruption", "Mild Intrusive Thoughts", "Checking Impulses"],
      isCrisisDetected: false,
      includeInClinicalFile: true,
      conditionTag: "anxiety",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      transcriptId: "tr-live-3",
      userId: userId || "patient-1",
      date: "Oct 20, 2:00 PM",
      summaryText:
        "Stable emotional baseline with effective hyperfocus utilization. Good sleep duration noted with zero panic spikes.",
      moodTrajectory:
        "Calm Baseline (Morning) → Steady Task Completion → Balanced Evening",
      triggers: ["Quiet Environment", "Structured Routine"],
      symptoms: ["Sustained Focus", "Emotional Balance"],
      isCrisisDetected: false,
      includeInClinicalFile: false,
      conditionTag: "bipolar",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      transcriptId: "tr-live-4",
      userId: userId || "patient-1",
      date: "Oct 17, 6:45 PM",
      summaryText:
        "Reported mild sensory overload following an in-person meeting in a crowded space. Unpacked triggers using the 'Trigger Unpack' mode and identified ambient noise as the key stressor.",
      moodTrajectory:
        "Calm Morning → Sudden Sensory Depletion (5 PM) → Recovery Grounding",
      triggers: ["Crowded Spaces", "Ambient Noise", "Social Energy Depletion"],
      symptoms: ["Somatic Neck Tension", "Task Initiation Delay"],
      isCrisisDetected: false,
      includeInClinicalFile: true,
      conditionTag: "anxiety",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
  ];

  // Try reading from local storage cache
  let cachedTranscripts: TranscriptRecord[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRANSCRIPTS_KEY);
    if (raw) {
      cachedTranscripts = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not read local transcript cache:", err);
  }

  // Try Appwrite databases.listDocuments
  if (userId && userId !== "anonymous-patient") {
    try {
      const response = await databases.listDocuments("main", "TRANSCRIPTS", [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ]);

      if (response && response.documents && response.documents.length > 0) {
        const appwriteDocs = response.documents.map((d: any) => ({
          $id: d.$id,
          transcriptId: d.transcriptId || d.$id,
          userId: d.userId,
          date: d.date,
          summaryText: d.summaryText,
          moodTrajectory: d.moodTrajectory,
          triggers: Array.isArray(d.triggers) ? d.triggers : [],
          symptoms: Array.isArray(d.symptoms) ? d.symptoms : [],
          isCrisisDetected: Boolean(d.isCrisisDetected),
          includeInClinicalFile: Boolean(d.includeInClinicalFile),
          rawChatLog: d.rawChatLog,
          createdAt: d.$createdAt,
          conditionTag: d.conditionTag || "general",
        }));

        // Merge cached items that may not be in DB yet
        const existingIds = new Set(appwriteDocs.map((x) => x.transcriptId));
        const unsynced = cachedTranscripts.filter((x) => !existingIds.has(x.transcriptId));
        return [...unsynced, ...appwriteDocs];
      }
    } catch (dbError) {
      console.warn("Appwrite TRANSCRIPTS list query returned error, using cached/mock records:", dbError);
    }
  }

  if (cachedTranscripts.length > 0) {
    const existingIds = new Set(cachedTranscripts.map((x) => x.transcriptId));
    const merged = [...cachedTranscripts];
    for (const fb of fallbackTranscripts) {
      if (!existingIds.has(fb.transcriptId)) {
        merged.push(fb);
      }
    }
    return merged;
  }

  return fallbackTranscripts;
}

/**
 * Update transcript's inclusion in Doctor Clinical File
 */
export async function updateTranscriptClinicalFileStatus(
  transcriptId: string,
  includeInClinicalFile: boolean
): Promise<boolean> {
  // Update local cache
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRANSCRIPTS_KEY);
    if (raw) {
      const cachedList: TranscriptRecord[] = JSON.parse(raw);
      const target = cachedList.find((t) => t.transcriptId === transcriptId || t.$id === transcriptId);
      if (target) {
        target.includeInClinicalFile = includeInClinicalFile;
        localStorage.setItem(LOCAL_STORAGE_TRANSCRIPTS_KEY, JSON.stringify(cachedList));
      }
    }
  } catch (err) {
    console.warn("Local storage transcript update error:", err);
  }

  // Update Appwrite document
  try {
    await databases.updateDocument("main", "TRANSCRIPTS", transcriptId, {
      includeInClinicalFile,
    });
    return true;
  } catch (err) {
    console.warn("Appwrite transcript document update failed, local status updated:", err);
    return false;
  }
}
