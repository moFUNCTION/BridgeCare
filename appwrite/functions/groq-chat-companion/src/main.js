import { Client, Databases } from "node-appwrite";

/**
 * Appwrite Cloud Function: groq-chat-companion
 * Handles 24/7 AI venting conversation, real-time crisis detection, and clinical insight extraction.
 */
export default async ({ req, res, log, error }) => {
  try {
    let body = {};
    if (typeof req.body === "string" && req.body.trim()) {
      try {
        body = JSON.parse(req.body);
      } catch (e) {
        body = {};
      }
    } else if (typeof req.body === "object" && req.body !== null) {
      body = req.body;
    }

    const { messages = [], ventingMode = "free", language = "en", userId } = body;

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    // Handle extraction mode for live insights
    if (ventingMode === "extract_insights") {
      if (!GROQ_API_KEY) {
        return res.json({
          moodTrajectory: "Reflective / Receptive",
          baselineState: "Baseline calmness — Venting start",
          extractedTriggers: ["Daily routine strain"],
          behavioralMarkers: ["Mild cognitive load"],
          includeInClinicalFile: true,
        });
      }

      const extractionPrompt = `You are a clinical transcription assistant for BridgeCare.
Extract clinical insights from this patient conversation in strict JSON format:
{
  "moodTrajectory": "e.g. Elevated Focus (morning) -> Sensory Overload (afternoon)",
  "baselineState": "e.g. Mildly anxious but communicative",
  "extractedTriggers": ["trigger 1", "trigger 2"],
  "behavioralMarkers": ["symptom or behavioral marker 1", "marker 2"]
}

Conversation:
${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}`;

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: extractionPrompt }],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });

      const groqData = await groqRes.json();
      const content = groqData.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content || "{}");
      return res.json({
        moodTrajectory: parsed.moodTrajectory || "Reflective / Receptive",
        baselineState: parsed.baselineState || "Baseline calmness — Venting start",
        extractedTriggers: parsed.extractedTriggers || ["Daily routine strain"],
        behavioralMarkers: parsed.behavioralMarkers || ["Mild cognitive load"],
        includeInClinicalFile: true,
      });
    }

    // Standard Venting Chat Mode
    let modeGuidance = "";
    if (ventingMode === "trigger") {
      modeGuidance = "Mode: Unpack a Trigger. Socratic, gentle questioning to identify what sparked the distress.";
    } else if (ventingMode === "night") {
      modeGuidance = "Mode: Late-Night Calm. Slow, low-stimulus rhythm, combating rumination, anxiety, and insomnia.";
    } else if (ventingMode === "doctor") {
      modeGuidance = "Mode: Prep Doctor Session. Help patient organize thoughts and summarize weekly struggles for their psychiatrist.";
    } else {
      modeGuidance = "Mode: Free Venting. Pure emotional listening, warmth, and active validation without unsolicited advice.";
    }

    const langInstruction =
      language === "ar"
        ? "Respond warmly and naturally in Arabic with comforting, non-stigmatizing phrasing."
        : "Respond in English with deep empathy and warmth.";

    const systemPrompt = `You are "Sora", the warm, empathetic 24/7 AI Daily Venting Companion for BridgeCare — a judgment-free, stigma-free mental health support ecosystem.
Your role: Listen with immense warmth, validate feelings across all psychological conditions (ADHD, Depression, Bipolar, OCD, Anxiety, PTSD), and never treat neurodivergence as a flaw.
${modeGuidance}
${langInstruction}
Brevity: 2-4 thoughtful, comforting sentences. Do not overwhelm someone who is actively venting.
CRITICAL CRISIS SAFETY PROTOCOL: If the user indicates self-harm, suicidality, or severe immediate danger (e.g., wanting to end their life), respond with immediate compassion, provide safety resources, AND append the exact flag "[CRISIS_DETECTED]".`;

    if (!GROQ_API_KEY) {
      log("Warning: GROQ_API_KEY not configured. Using compassionate local fallback.");
      const lastUserMsg = messages[messages.length - 1]?.content || "";
      const isCrisisFallback = /suicide|kill myself|end my life|انتحار|اقتل نفسي/i.test(lastUserMsg);
      const fallbackReply =
        language === "ar"
          ? "أنا هنا بجانبك واستمع إليك بكل اهتمام. خذ نفساً عميقاً واخبرني بكل ما تشعر به دون أي تردد."
          : "I am right here with you, listening without any judgment. Take a gentle breath and share whatever is on your mind.";

      return res.json({
        reply: fallbackReply,
        isCrisis: isCrisisFallback,
        mode: ventingMode,
      });
    }

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.6,
      max_tokens: 500,
    };

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const groqData = await groqRes.json();
    const rawReply = groqData.choices?.[0]?.message?.content || "I am listening. Take all the time you need.";
    const isCrisis = rawReply.includes("[CRISIS_DETECTED]");
    const cleanReply = rawReply.replace("[CRISIS_DETECTED]", "").trim();

    return res.json({
      reply: cleanReply,
      isCrisis,
      mode: ventingMode,
    });
  } catch (err) {
    error("Error in groq-chat-companion: " + err.message);
    return res.json(
      {
        reply: "I am here with you. Please take a slow, gentle breath and let me know how you are feeling.",
        isCrisis: false,
        error: err.message,
      },
      500
    );
  }
};
