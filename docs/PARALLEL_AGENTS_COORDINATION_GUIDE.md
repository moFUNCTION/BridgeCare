# BridgeCare — Parallel AI Agents Coordination Guide

> **Document Status**: Master Operational Protocol  
> **Target Audience**: Multi-Agent Orchestrator & 5 Autonomous AI Agents  
> **Primary Goal**: High-speed, zero-conflict parallel execution across all 4 pillars and backend infrastructure.  

---

## 1. The 5-Agent Division of Labor & Domain Matrix

To achieve lightning-fast parallel progress with **ZERO merge conflicts or file collisions**, each agent is assigned a strictly isolated domain, distinct files, and predefined data interfaces:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        BRIDGECARE MULTI-AGENT ARCHITECTURE MATRIX                       │
├─────────┬──────────────────────────────────┬─────────────────────────────┬─────────────┤
│ AGENT   │ DOMAIN & ROLE                    │ EXCLUSIVE WRITE PATHS       │ CORE ENGINE │
├─────────┼──────────────────────────────────┼─────────────────────────────┼─────────────┤
│ AGENT 1 │ Backend, Security & Cloud Funcs  │ appwrite/functions/*        │ Appwrite    │
│         │ (Database collections & APIs)    │ appwrite/appwrite.json      │ Cloud Node  │
├─────────┼──────────────────────────────────┼─────────────────────────────┼─────────────┤
│ AGENT 2 │ Pillar 1: AI Companion & Logs    │ src/Pages/Portal/AiChat.tsx │ Groq API    │
│         │ (Venting modes & Transcripts)    │ src/Pages/Portal/AiReports  │ LLM Stream  │
│         │                                  │ src/services/groqService.ts │             │
├─────────┼──────────────────────────────────┼─────────────────────────────┼─────────────┤
│ AGENT 3 │ Pillar 2: Gamified Screening     │ src/Pages/Portal/Mental*    │ Interactive │
│         │ (Attention, Mood, Pattern games) │ src/Pages/Portal/OnlineEra  │ Canvas /    │
│         │                                  │ src/services/gameService.ts │ Telemetry   │
├─────────┼──────────────────────────────────┼─────────────────────────────┼─────────────┤
│ AGENT 4 │ Pillar 3: Therapists & Telehealth│ src/Pages/Portal/Therapists*│ ZEGOCLOUD   │
│         │ (Booking & Pre-Session Dossier)  │ src/Pages/Portal/Latest*    │ WebRTC /    │
│         │                                  │ src/Pages/Portal/Billing*   │ UI-Kit      │
│         │                                  │ src/services/zegocloud*     │             │
│         │                                  │ src/services/clinicalFile*  │             │
├─────────┼──────────────────────────────────┼─────────────────────────────┼─────────────┤
│ AGENT 5 │ Pillar 4 & Privacy Vault         │ src/Pages/Portal/Community* │ Groq Moder- │
│         │ (Anonymous feed & Vault security)│ src/Pages/Portal/Password*  │ ation / E2E │
│         │                                  │ src/Pages/Portal/User*      │ Encryption  │
│         │                                  │ src/services/community*     │             │
│         │                                  │ src/services/privacy*       │             │
└─────────┴──────────────────────────────────┴─────────────────────────────┴─────────────┘
```

---

## 2. Zero-Conflict Boundary Rules (Strict Protocol)

All 5 AI agents must strictly follow these rules:

1. **Rule of Exclusive Ownership**:
   - An agent may **ONLY modify files listed under its Exclusive Write Paths**.
   - If an agent touches a file owned by another agent, the build pipeline will reject the change.
2. **Read-Only Shared Contracts**:
   - The master database schema defined in `docs/01_APPWRITE_BACKEND_AND_SECURITY_PLAN.md` is the Single Source of Truth for collection IDs and attribute keys.
   - Agents consume shared data contracts using strict TypeScript interfaces.
3. **Localization (`i18n`) Segregation**:
   - To prevent merge collisions in `ar.json` and `en.json`, each agent writes translations under its own dedicated root key:
     - Agent 2: `"aiChat": { ... }`, `"aiReports": { ... }`
     - Agent 3: `"games": { ... }`
     - Agent 4: `"therapists": { ... }`, `"sessions": { ... }`, `"billing": { ... }`
     - Agent 5: `"community": { ... }`, `"privacy": { ... }`, `"profile": { ... }`
4. **Mock-First Resiliency**:
   - Frontend services must include local mock fallbacks so UI components function immediately even before cloud functions are fully deployed.
5. **No Blind Builds**:
   - Follow the global project rule: **Do NOT run `npm run build` arbitrarily**. Validate code using `npx tsc --noEmit` within `apps/Main`.

---

## 3. Global Shared Data Contracts

All agents communicate across boundaries using these standardized Appwrite document structures:

### A. Indicative Game Score Contract (Produced by Agent 3, Consumed by Agent 4)
```typescript
export interface ScreeningScoreDoc {
  scoreId: string;
  userId: string;
  gameType: "attention" | "mood" | "pattern";
  scoreNumerator: number; // e.g. 7 for 7/10
  scoreDenominator: number; // 10
  telemetryMetrics: string; // JSON string
  interpretationKey: string;
  completedAt: string; // ISO
}
```

### B. Daily Transcript Contract (Produced by Agent 2, Consumed by Agent 4)
```typescript
export interface DailyTranscriptDoc {
  transcriptId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  summaryText: string;
  moodTrajectory: string;
  triggers: string[];
  symptoms: string[];
  isCrisisDetected: boolean;
  includeInClinicalFile: boolean;
}
```

### C. Pre-Session Clinical Dossier Contract (Produced by Agent 4, Built by Agent 1)
```typescript
export interface ClinicalFileDoc {
  fileId: string;
  patientId: string;
  therapistId: string;
  executiveSummary: string;
  longitudinalTimelineJson: string;
  gameScorecardJson: string;
  patientGoals: string;
  status: "draft" | "shared" | "revoked";
  createdAt: string;
}
```

### D. ZEGOCLOUD Room Token Contract (Produced by Agent 1, Consumed by Agent 4)
```typescript
export interface ZegoTokenResponse {
  token: string;
  appId: number;
  roomId: string;
  userId: string;
  role: "patient" | "therapist";
  expiresIn: number;
}
```

---

## 4. Agent Execution Plans Directory

Each agent has a complete, standalone implementation blueprint:

- **Agent 1 Plan**: [`docs/AGENT_1_BACKEND_APPWRITE_FUNCTIONS.md`](./AGENT_1_BACKEND_APPWRITE_FUNCTIONS.md)
- **Agent 2 Plan**: [`docs/AGENT_2_PILLAR1_AI_COMPANION_GROQ.md`](./AGENT_2_PILLAR1_AI_COMPANION_GROQ.md)
- **Agent 3 Plan**: [`docs/AGENT_3_PILLAR2_GAMIFIED_SCREENING.md`](./AGENT_3_PILLAR2_GAMIFIED_SCREENING.md)
- **Agent 4 Plan**: [`docs/AGENT_4_PILLAR3_THERAPISTS_ZEGOCLOUD.md`](./AGENT_4_PILLAR3_THERAPISTS_ZEGOCLOUD.md)
- **Agent 5 Plan**: [`docs/AGENT_5_PILLAR4_COMMUNITY_AND_PRIVACY.md`](./AGENT_5_PILLAR4_COMMUNITY_AND_PRIVACY.md)
