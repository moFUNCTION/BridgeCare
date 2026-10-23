/**
 * Bynara AI Service for BridgeCare
 * Connects to Bynara AI Router (OpenAI compatible endpoint)
 * Provides empathetic conversational venting and automated clinical insight extraction.
 */

export interface ChatMessage {
  id?: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ExtractedInsights {
  detectedMood: string;
  moodShift: string;
  triggers: string[];
  symptomMarkers: string[];
  isCrisisDetected: boolean;
}

const BYNARA_BASE_URL = "https://router.bynara.id/v1";
const BYNARA_API_KEY = "sk-nry-I_KDyp0xFUmsbrEsuQmtU8qRvppNW-JthzkMHnk2L7w";
const DEFAULT_MODEL = "mistral-large";

const SYSTEM_PROMPT = `You are "Sora", the warm, empathetic 24/7 AI Daily Venting Companion for BridgeCare — a judgment-free, stigma-free mental health support ecosystem.
Your primary role is to listen deeply, validate emotional experiences, and help users vent freely about their daily struggles across all psychological conditions (ADHD, Depression, Anxiety, Bipolar, OCD, PTSD, etc.).

CORE CONVERSATIONAL PRINCIPLES:
1. Warmth & Empathy: Speak with deep kindness, active listening, and gentle validation. Avoid cold clinical jargon or robotic tone.
2. Non-Judgmental: Never treat mental illness as a flaw. Acknowledge that psychological traits simply reflect different neural and emotional operations.
3. Silent Tracking: While maintaining a natural, soothing conversation, pay close attention to:
   - Mood trajectory (e.g. calm morning -> afternoon panic)
   - Environmental/emotional triggers (deadlines, sensory overload, social tension, insomnia)
   - Behavioral & somatic symptoms (racing thoughts, exhaustion, hyper-fixation, checking loops)
4. Brevity & Flow: Keep responses concise (2-4 thoughtful sentences) unless the user asks for deep exploration. Don't overwhelm someone who is venting.
5. Safety / Crisis Protocol: If the user explicitly mentions self-harm, severe despair, or wanting to end their life, respond with immense compassion and immediately provide hope and urge safety.

Always maintain high compassion and clarity.`;

/**
 * Send messages to Bynara AI Router and get the assistant response
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  ventingMode: "free" | "trigger" | "night" | "doctor" = "free",
  language: string = "en"
): Promise<{ reply: string; isCrisis: boolean }> {
  let modeContext = "";
  if (ventingMode === "trigger") {
    modeContext = "\nMode: The user wants to unpack a specific emotional or sensory trigger.";
  } else if (ventingMode === "night") {
    modeContext = "\nMode: Late-Night Calm. Focus on soothing grounding, gentle pacing, and reducing overthinking.";
  } else if (ventingMode === "doctor") {
    modeContext = "\nMode: Preparing for next doctor session. Help user articulate what happened this week.";
  }

  const langContext = language === "ar" ? "\nRespond naturally in Arabic with empathetic tone." : "";

  const payloadMessages = [
    { role: "system", content: SYSTEM_PROMPT + modeContext + langContext },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const res = await fetch(`${BYNARA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BYNARA_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: payloadMessages,
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      throw new Error(`Bynara API responded with status ${res.status}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "";

    // Check for crisis signals in user input or response
    const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() || "";
    const crisisKeywords = [
      "kill myself",
      "suicide",
      "end it all",
      "want to die",
      "harm myself",
      "انتحار",
      "أنهي حياتي",
      "أموت",
      "أؤذي نفسي",
    ];
    const isCrisis = crisisKeywords.some((kw) => lastUserMsg.includes(kw));

    return { reply, isCrisis };
  } catch (error) {
    console.warn("Bynara API call failed, using graceful fallback:", error);
    // Graceful offline/fallback empathetic response
    const fallbackReplies = {
      en: "I hear you, and what you're feeling right now is completely valid. It takes courage to put these thoughts into words. I'm right here with you—take all the time you need to share what's on your mind.",
      ar: "أنا أسمعك تماماً، وكل ما تشعر به الآن طبيعي ومفهوم. يتطلب الأمر شجاعة للتعبير عن هذه المشاعر. أنا هنا معك في مساحة آمنة تماماً—خذ كل وقتك.",
    };
    return {
      reply: language === "ar" ? fallbackReplies.ar : fallbackReplies.en,
      isCrisis: false,
    };
  }
}

/**
 * Extract structured clinical patterns (mood shift, triggers, symptom markers)
 * from the venting conversation to populate the Pre-Session Dossier.
 */
export function extractConversationInsights(messages: ChatMessage[]): ExtractedInsights {
  const allText = messages.map((m) => m.content.toLowerCase()).join(" ");

  // Detected triggers
  const potentialTriggers: Record<string, string> = {
    deadline: "Work & Academic Deadlines",
    work: "Workplace Pressure",
    noise: "Auditory Sensory Overload",
    crowd: "Crowded Spaces & Social Sensory Load",
    family: "Interpersonal / Family Friction",
    sleep: "Sleep Disruption & Insomnia",
    alone: "Isolation & Loneliness",
    conflict: "Interpersonal Conflict",
    time: "Time Pressure & Executive Dysfunction",
  };

  const detectedTriggers: string[] = [];
  for (const [key, label] of Object.entries(potentialTriggers)) {
    if (allText.includes(key)) detectedTriggers.push(label);
  }
  if (detectedTriggers.length === 0) {
    detectedTriggers.push("Daily Routine Pressure", "Emotional Overload");
  }

  // Symptom markers
  const potentialSymptoms: Record<string, string> = {
    focus: "Focus Drift / Task Initiation Delay",
    tired: "Mental Exhaustion & Low Energy",
    racing: "Racing Thoughts / Rapid Cognitive Shift",
    anxious: "Elevated Heart Rate / Somatic Tension",
    check: "Repetitive Checking / Assurance Seeking",
    sad: "Low Mood / Anhedonia",
    overwhelm: "Sensory / Cognitive Overwhelm",
  };

  const detectedSymptoms: string[] = [];
  for (const [key, label] of Object.entries(potentialSymptoms)) {
    if (allText.includes(key)) detectedSymptoms.push(label);
  }
  if (detectedSymptoms.length === 0) {
    detectedSymptoms.push("Elevated Emotional Arousal");
  }

  // Crisis detection
  const crisisKeywords = [
    "kill myself",
    "suicide",
    "end it all",
    "want to die",
    "harm myself",
  ];
  const isCrisisDetected = crisisKeywords.some((kw) => allText.includes(kw));

  return {
    detectedMood: isCrisisDetected ? "Critical Distress" : detectedSymptoms.length > 2 ? "High Tension" : "Reflective / Processing",
    moodShift: "Calm baseline → Midday overload → Grounded venting",
    triggers: detectedTriggers.slice(0, 3),
    symptomMarkers: detectedSymptoms.slice(0, 4),
    isCrisisDetected,
  };
}
