# Appwrite Backend, Cloud Functions & Security Plan

> **Document Status**: Production Blueprint  
> **Target Audience**: AI Agents & Backend Engineers  
> **Scope**: Appwrite Database Schema, Document-Level Security (Vault A / Vault B), and Cloud Functions Execution  

---

## 1. Appwrite Infrastructure Setup

- **Endpoint**: `https://fra.cloud.appwrite.io/v1`
- **Project ID**: `6adaf3cd000458c04102`
- **Database ID**: `main`
- **Teams**:
  - `patients` (ID: `patients`): All registered patients.
  - `therapists` (ID: `therapists`): Verified licensed clinicians.

---

## 2. Database Collections & Attributes Specification

Each collection must be created in the `main` database with Document Security enabled (`documentSecurity: true`).

### Collection 1: `USERS` (Vault A: Identity & PII)
Stores personal contact and verification data.
- **Permissions**: `Permission.read(Role.user(userId))`, `Permission.update(Role.user(userId))`
- **Attributes**:
  - `userId` (String, size 36, required)
  - `userName` (String, size 128, optional)
  - `email` (String, size 256, required)
  - `phoneNumber` (String, size 32, optional)
  - `age` (Integer, min 0, max 150, optional)
  - `country` (String, size 128, optional)
  - `role` (String, size 32, default `"patient"`, enum: `["patient", "therapist", "admin"]`)
  - `anonymousAlias` (String, size 64, required, e.g., `"CalmRiver92"`)
  - `avatarId` (String, size 64, default `"avatar-teal-1"`)

### Collection 2: `TRANSCRIPTS` (Vault B: Daily Longitudinal Logs)
Stores auto-generated daily summaries of patient venting sessions. Zero personal names or emails.
- **Permissions**: `Permission.read(Role.user(userId))`, `Permission.write(Role.user(userId))`, `Permission.delete(Role.user(userId))`
- **Attributes**:
  - `transcriptId` (String, size 36, required)
  - `userId` (String, size 36, required)
  - `date` (String, size 10, required, format `"YYYY-MM-DD"`)
  - `rawChatLog` (String, size 100000, optional, encrypted JSON)
  - `summaryText` (String, size 5000, required)
  - `moodTrajectory` (String, size 256, required, e.g. `"Calm morning -> High anxiety 4PM"`)
  - `triggers` (String Array, max items 50, size 128)
  - `symptoms` (String Array, max items 50, size 128)
  - `isCrisisDetected` (Boolean, default `false`)
  - `includeInClinicalFile` (Boolean, default `true`)

### Collection 3: `SCREENING_SCORES` (Vault B: Gamified Telemetry)
Stores results from interactive games (Pillar 2).
- **Permissions**: `Permission.read(Role.user(userId))`, `Permission.write(Role.user(userId))`
- **Attributes**:
  - `scoreId` (String, size 36, required)
  - `userId` (String, size 36, required)
  - `gameType` (String, size 32, enum: `["attention", "mood", "pattern"]`)
  - `scoreNumerator` (Integer, min 1, max 10, e.g. `7` for `7/10`)
  - `scoreDenominator` (Integer, default `10`)
  - `telemetryMetrics` (String, size 10000, JSON string: reaction time, variance, switch speed)
  - `interpretationKey` (String, size 128, e.g. `"ADHD Focus Drift Indicator"`)
  - `completedAt` (String, size 32, ISO timestamp)

### Collection 4: `CLINICAL_FILES` (Vault B: Pre-Session Briefs)
Compiled dossier combining daily chat summaries and game scores for doctors.
- **Permissions**: `Permission.read(Role.user(patientId))`, `Permission.read(Role.user(therapistId))`, `Permission.update(Role.user(patientId))`
- **Attributes**:
  - `fileId` (String, size 36, required)
  - `patientId` (String, size 36, required)
  - `therapistId` (String, size 36, required)
  - `executiveSummary` (String, size 5000, required)
  - `longitudinalTimelineJson` (String, size 20000, JSON format)
  - `gameScorecardJson` (String, size 10000, JSON format)
  - `patientGoals` (String, size 2000, optional)
  - `status` (String, size 32, default `"shared"`, enum: `["draft", "shared", "revoked"]`)
  - `createdAt` (String, size 32, ISO timestamp)
  - `revokedAt` (String, size 32, optional)

### Collection 5: `THERAPISTS` (Directory of Clinicians)
- **Permissions**: `Permission.read(Role.any())`, `Permission.write(Role.user(therapistId))`
- **Attributes**:
  - `therapistId` (String, size 36, required)
  - `fullName` (String, size 128, required)
  - `title` (String, size 64, required, e.g. `"Licensed Clinical Psychiatrist"`)
  - `licenseNumber` (String, size 64, required)
  - `specialties` (String Array, max items 30, size 64, e.g. `["ADHD", "Bipolar", "OCD", "Anxiety"]`)
  - `sessionFee` (Float, min 0, required)
  - `currency` (String, size 8, default `"USD"`)
  - `rating` (Float, min 0, max 5, default `5.0`)
  - `reviewCount` (Integer, default `0`)
  - `bio` (String, size 2000, required)
  - `avatarUrl` (String, size 512, optional)
  - `acceptsBridgeCareBrief` (Boolean, default `true`)

### Collection 6: `SESSIONS` (Appointments & Telehealth Rooms)
- **Permissions**: `Permission.read(Role.user(patientId))`, `Permission.read(Role.user(therapistId))`, `Permission.write(Role.user(patientId))`
- **Attributes**:
  - `sessionId` (String, size 36, required)
  - `patientId` (String, size 36, required)
  - `therapistId` (String, size 36, required)
  - `sessionNumber` (Integer, default `1`)
  - `scheduledAt` (String, size 32, ISO timestamp)
  - `durationMinutes` (Integer, default `50`)
  - `status` (String, size 32, default `"booked"`, enum: `["booked", "live", "completed", "cancelled"]`)
  - `zegoRoomId` (String, size 64, required, e.g. `"room-session-98432"`)
  - `clinicalNotes` (String, size 5000, optional, written by doctor)
  - `prescriptionsJson` (String, size 5000, optional)

### Collection 7: `COMMUNITY_POSTS` (Anonymous Social Feed)
- **Permissions**: `Permission.read(Role.any())`, `Permission.write(Role.users())`
- **Attributes**:
  - `postId` (String, size 36, required)
  - `authorId` (String, size 36, required, patient userId)
  - `authorAlias` (String, size 64, required, pseudonym)
  - `authorAvatar` (String, size 64, required)
  - `conditionSpace` (String, size 64, enum: `["all", "adhd", "depression", "bipolar", "anxiety", "ocd", "ptsd", "wins"]`)
  - `content` (String, size 4000, required)
  - `relateCount` (Integer, default `0`)
  - `strengthCount` (Integer, default `0`)
  - `helpfulCount` (Integer, default `0`)
  - `isModerated` (Boolean, default `true`)
  - `createdAt` (String, size 32, ISO timestamp)

### Collection 8: `COMMUNITY_COMMENTS` (Nested Discussion)
- **Permissions**: `Permission.read(Role.any())`, `Permission.write(Role.users())`
- **Attributes**:
  - `commentId` (String, size 36, required)
  - `postId` (String, size 36, required)
  - `authorAlias` (String, size 64, required)
  - `authorAvatar` (String, size 64, required)
  - `content` (String, size 2000, required)
  - `createdAt` (String, size 32, ISO timestamp)

---

## 3. Appwrite Cloud Functions Architecture

All sensitive operations, external AI calls to Groq, and WebRTC token generations must execute in Appwrite Cloud Functions to protect API secrets.

```
appwrite/functions/
├── register-patient/             # Exists: Role & User creation
├── register-doctor/              # New: Clinician onboarding & license verification
├── groq-chat-companion/          # New: Empathetic AI chat proxy using Groq API
├── groq-generate-daily-transcript/# New: Auto-transcript summarizer
├── groq-clinical-brief-compiler/ # New: Pre-Session Clinical Dossier generator
├── groq-community-moderator/     # New: Real-time content safety & anti-bullying
└── zegocloud-token-generator/    # New: Generates secure RTC room tokens for video
```

---

## 4. Cloud Function 1: `groq-chat-companion`

### Purpose
Acts as the secure conversational broker between the patient and Groq's high-speed inference engine (`llama-3.3-70b-versatile`).

### Environment Variables
- `GROQ_API_KEY`: Groq Cloud API Secret Token
- `APPWRITE_API_KEY`: Server SDK Secret
- `APPWRITE_ENDPOINT`: `https://fra.cloud.appwrite.io/v1`
- `APPWRITE_PROJECT_ID`: `6adaf3cd000458c04102`

### Implementation Blueprint (`src/main.js`)
```javascript
const { Client, Databases } = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  try {
    const payload = JSON.parse(req.bodyText || '{}');
    const { messages, ventingMode = 'free', language = 'en', userId } = payload;

    if (!messages || !Array.isArray(messages)) {
      return res.json({ error: 'Invalid message payload' }, 400);
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.json({ error: 'Groq API Key not configured' }, 500);
    }

    // System Prompt tailored to BridgeCare principles
    const systemPrompt = `You are "Sora", the warm, empathetic 24/7 AI Daily Venting Companion for BridgeCare — a judgment-free mental health support ecosystem.
Your role: Listen with immense warmth, validate feelings across all psychological conditions (ADHD, Depression, Bipolar, OCD, Anxiety, PTSD), and never treat neurodivergence as a flaw.
Venting Mode: ${ventingMode} (free venting, trigger unpacking, late-night calm, or doctor prep).
Language: ${language === 'ar' ? 'Respond fluently and empathetically in Arabic' : 'Respond in English'}.
Brevity: 2-4 thoughtful, comforting sentences.
CRITICAL SAFETY: If the user indicates self-harm, suicidality, or severe immediate danger, return your compassionate response AND include the exact flag "[CRISIS_DETECTED]".`;

    const groqPayload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      temperature: 0.6,
      max_tokens: 500,
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(groqPayload),
    });

    const data = await response.json();
    const replyText = data.choices[0]?.message?.content || 'I am here with you. Please take a deep breath.';
    const isCrisis = replyText.includes('[CRISIS_DETECTED]');
    const cleanReply = replyText.replace('[CRISIS_DETECTED]', '').trim();

    return res.json({
      reply: cleanReply,
      isCrisis,
      mode: ventingMode,
    });
  } catch (err) {
    error('Error in groq-chat-companion: ' + err.message);
    return res.json({ error: err.message }, 500);
  }
};
```

---

## 5. Cloud Function 2: `zegocloud-token-generator`

### Purpose
Generates secure authentication tokens for patient and doctor to enter the live HD Telehealth consultation room powered by ZEGOCLOUD.

### Environment Variables
- `ZEGO_APP_ID`: ZEGOCLOUD App ID (Number)
- `ZEGO_SERVER_SECRET`: ZEGOCLOUD Server Secret (String, 32 hex chars)

### Implementation Blueprint (`src/main.js`)
```javascript
const crypto = require('crypto');

/**
 * Generate ZEGOCLOUD Room Token (Server-Side)
 */
function generateZegoToken(appId, serverSecret, roomId, userId, effectiveTimeInSeconds = 7200) {
  const createTime = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(4).readUInt32BE(0);
  const payload = {
    room_id: roomId,
    privilege: {
      1: 1, // Login Room
      2: 1, // Publish Stream
    },
    stream_id_list: null,
  };

  const payloadString = JSON.stringify(payload);
  const signatureRaw = `${appId}${userId}${nonce}${createTime}${payloadString}`;
  const hash = crypto.createHmac('sha256', serverSecret).update(signatureRaw).digest('hex');

  const tokenInfo = {
    ver: 1,
    hash,
    nonce,
    ctime: createTime,
    expire: createTime + effectiveTimeInSeconds,
    payload: payloadString,
  };

  return '04' + Buffer.from(JSON.stringify(tokenInfo)).toString('base64');
}

module.exports = async ({ req, res, log, error }) => {
  try {
    const payload = JSON.parse(req.bodyText || '{}');
    const { roomId, userId, role = 'patient' } = payload;

    if (!roomId || !userId) {
      return res.json({ error: 'roomId and userId are required' }, 400);
    }

    const appId = Number(process.env.ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_SERVER_SECRET;

    if (!appId || !serverSecret) {
      return res.json({ error: 'ZEGOCLOUD credentials not configured' }, 500);
    }

    const token = generateZegoToken(appId, serverSecret, roomId, userId);

    return res.json({
      token,
      appId,
      roomId,
      userId,
      role,
      expiresIn: 7200,
    });
  } catch (err) {
    error('Error generating ZEGOCLOUD token: ' + err.message);
    return res.json({ error: err.message }, 500);
  }
};
```

---

## 6. Cloud Function 3: `groq-community-moderator`

### Purpose
Real-time AI safety shield that screens community posts for bullying, harassment, self-harm encouragement, and toxic hate speech using Groq's high-speed inference.

### Implementation Blueprint (`src/main.js`)
```javascript
module.exports = async ({ req, res, error }) => {
  try {
    const { content, conditionSpace } = JSON.parse(req.bodyText || '{}');
    if (!content) return res.json({ error: 'Content is required' }, 400);

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    const moderationPrompt = `You are a clinical and peer community safety moderator for BridgeCare.
Review this mental health community post:
"""
${content}
"""

Evaluate for:
1. Severe self-harm instructions or encouragement (CRITICAL)
2. Bullying, harassment, or verbal abuse
3. Medical prescribing advice from non-doctors
4. Toxic profanity or hatred

Respond in strict JSON format:
{
  "isSafe": boolean,
  "flagReason": "clean" | "self_harm" | "bullying" | "medical_advice" | "toxic",
  "explanation": "Short supportive explanation if flagged",
  "suggestedWarning": null | "trigger_warning_content"
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: moderationPrompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0]?.message?.content || '{}');

    return res.json(result);
  } catch (err) {
    error('Error in groq-community-moderator: ' + err.message);
    return res.json({ isSafe: true, flagReason: 'clean', explanation: '' });
  }
};
```

---

## 7. Appwrite Deployment Commands & CLI Workflow

```bash
# 1. Login to Appwrite CLI
appwrite login

# 2. Deploy all cloud functions
appwrite deploy function

# 3. Deploy and sync database collections
appwrite deploy collection
```
