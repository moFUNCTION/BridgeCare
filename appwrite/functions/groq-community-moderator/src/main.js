/**
 * Appwrite Cloud Function: groq-community-moderator
 * Evaluates mental health community posts and comments for safety,
 * preventing cyberbullying, self-harm encouragement, and unverified medical prescriptions.
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

    const { content = "", conditionSpace = "all" } = body;

    if (!content.trim()) {
      return res.json({ error: "Content is required for moderation review" }, 400);
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    // Fast heuristic evaluation fallback if Groq API key is not yet configured
    if (!GROQ_API_KEY) {
      log("Notice: GROQ_API_KEY not configured. Running heuristic moderation rules.");

      const lower = content.toLowerCase();
      // Check severe self-harm promotion
      if (/kill yourself|go die|how to commit suicide|انتحر|طريقة انتحار/i.test(lower)) {
        return res.json({
          isSafe: false,
          flagReason: "self_harm",
          explanation: "Content contains self-harm encouragement or lethal methods.",
          suggestedWarning: "crisis_intervention",
        });
      }

      // Check unlicensed medical prescription advice
      if (/(take|prescribe|dose)\s+\d+\s*(mg|milligrams)|(خذ|جرعة)\s+\d+\s*(ملغ|ملجم)/i.test(lower)) {
        return res.json({
          isSafe: false,
          flagReason: "medical_advice",
          explanation: "Only licensed doctors can suggest specific medication dosages in BridgeCare.",
          suggestedWarning: "medical_disclaimer",
        });
      }

      // Check abusive bullying
      if (/you are crazy|loser|fake illness|مريض نفسي كذاب|مجنون/i.test(lower)) {
        return res.json({
          isSafe: false,
          flagReason: "bullying",
          explanation: "Content violates community guidelines against mocking or invalidating peer struggles.",
          suggestedWarning: null,
        });
      }

      return res.json({
        isSafe: true,
        flagReason: "clean",
        explanation: "Content approved by safety filters.",
        suggestedWarning: null,
      });
    }

    // Full Groq Cloud Inference Moderation
    const moderationPrompt = `You are the safety and clinical community guardian for BridgeCare — a safe, anonymous mental health peer ecosystem.
Evaluate the following community post in the "${conditionSpace}" space:
"""
${content}
"""

Evaluate against these 4 non-negotiable criteria:
1. "self_harm": Instructions, encouragement, or romanticization of self-harm or suicide.
2. "medical_advice": Recommending specific prescription medication names and milligram dosages.
3. "bullying": Stigmatizing, invalidating, mocking, or harassing peers.
4. "toxic": Hate speech, slurs, or hostile profanity.

Respond in strict JSON format:
{
  "isSafe": boolean,
  "flagReason": "clean" | "self_harm" | "medical_advice" | "bullying" | "toxic",
  "explanation": "Short, supportive, non-punitive explanation for the user if flagged",
  "suggestedWarning": null | "trigger_warning_content"
}`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: moderationPrompt }],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    const data = await groqRes.json();
    const resultJson = JSON.parse(data.choices?.[0]?.message?.content || "{}");

    return res.json({
      isSafe: resultJson.isSafe ?? true,
      flagReason: resultJson.flagReason || "clean",
      explanation: resultJson.explanation || "",
      suggestedWarning: resultJson.suggestedWarning || null,
    });
  } catch (err) {
    error("Error in groq-community-moderator: " + err.message);
    return res.json({
      isSafe: true,
      flagReason: "clean",
      explanation: "Approved with emergency bypass.",
      suggestedWarning: null,
    });
  }
};
