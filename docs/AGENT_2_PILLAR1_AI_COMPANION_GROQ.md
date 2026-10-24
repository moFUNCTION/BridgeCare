# AGENT 2 EXECUTION PLAN: Pillar 1 Lead (AI Companion, Groq Streaming & Transcripts)

> **Agent Identity**: Conversational AI & Clinical Telemetry Specialist  
> **Target Subsystem**: Pillar 1 (24/7 AI Companion, Venting Modes, Longitudinal Transcripts & Crisis Protocol)  
> **Output Deliverables**: Fully functional `AiChat.tsx`, `AiReports.tsx`, `groqService.ts`, and `CrisisHotlineModal.tsx`  

---

## 1. Exclusive File Ownership & Boundaries

### Authorized Write Paths (Exclusive to Agent 2)
- `d:\BridgeCare\apps\Main\src\Pages\Portal\AiChat.tsx`
- `d:\BridgeCare\apps\Main\src\Pages\Portal\AiReports.tsx`
- `d:\BridgeCare\apps\Main\src\services\groqService.ts`
- `d:\BridgeCare\apps\Main\src\components\CrisisHotlineModal.tsx`

### Strictly Off-Limits
- `apps/Main/src/Pages/Portal/MentalDetectorGames.tsx` & `OnlineEra.tsx` (Agent 3).
- `apps/Main/src/Pages/Portal/TherapistsDirectory.tsx` & `LatestSessions.tsx` (Agent 4).
- `apps/Main/src/Pages/Portal/Community*.tsx` (Agent 5).
- `appwrite/functions/*` (Agent 1).

---

## 2. Responsibilities & Deliverables

1. **Create `src/services/groqService.ts`**:
   - Implements `sendGroqChatMessage(messages, ventingMode, language, userId)`.
   - Implements `extractConversationInsights(messages)`.
   - Incorporates resilient fallback mocks if the Appwrite Cloud Function or Groq API is momentarily unreachable.
2. **Upgrade `AiChat.tsx`**:
   - Wire `handleSend` to `sendGroqChatMessage`.
   - Implement the 4 distinct venting modes:
     * `free`: Unfiltered empathetic reflection.
     * `trigger`: Socratic exploration of sensory/environmental stressors.
     * `night`: Low-stimulus grounding and overthinking de-escalation.
     * `doctor`: Structured articulation for the patient's next clinical visit.
   - Maintain the horizontal Chakra UI `ScrollArea` for venting modes and emotion starter chips.
   - Update the Live Insights Drawer in real time (mood shifts, triggers, behavioral markers).
   - Wire the "Include in Doctor Clinical File" toggle switch to update transcript metadata.
3. **Connect Longitudinal Transcripts in `AiReports.tsx`**:
   - Query Appwrite `TRANSCRIPTS` collection for the active patient.
   - Render historical daily summaries, mood trajectory charts, and trigger frequencies.
   - Add filter controls: "Filter by Trigger", "Filter by Condition" (ADHD, Anxiety, Bipolar).
4. **Enforce Crisis Safety Protocol**:
   - If Groq returns `isCrisis: true` or trigger keywords ("suicide", "end my life", "انتحار") are matched:
     * Immediately open `CrisisHotlineModal.tsx`.
     * Do not allow the AI to give unverified medical advice.

---

## 3. Step-by-Step Implementation Sequence

### Phase 1: Build `src/services/groqService.ts`
Follow the code blueprint in `docs/02_PILLAR_1_AI_COMPANION_AND_TRANSCRIPTS_PLAN.md`:
- Exports `ChatMessage` and `ExtractedInsights` interfaces.
- Calls `groq-chat-companion` function.
- Parses response and returns `{ reply, isCrisis }`.

### Phase 2: Refactor `AiChat.tsx`
- Replace imports of `bynaraService` with `groqService`.
- Wire user input submission and voice input toggles.
- Add periodic insight extraction every 3–4 messages.
- Ensure audio waveform visualizer pulses during voice-venting mode.

### Phase 3: Enhance `AiReports.tsx`
- Connect to Appwrite SDK `databases.listDocuments("main", "TRANSCRIPTS", [Query.equal("userId", user.$id)])`.
- Fall back to rich mock data if no documents exist yet for the user.
- Render the 30-day Readiness Meter ("Your Ready Doctor File is 85% complete").

---

## 4. Verification & Testing Protocol

- Run typecheck from `apps/Main`:
  ```bash
  npx tsc --noEmit
  ```
- Send a test message in `AiChat.tsx` and confirm Groq response streams without UI freezing.
- Switch between all 4 venting modes and verify that the system prompt adapts accordingly.
- Type a crisis phrase and verify that `CrisisHotlineModal.tsx` opens instantly with working phone/SMS links.
