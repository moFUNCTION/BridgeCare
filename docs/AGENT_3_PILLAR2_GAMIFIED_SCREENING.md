# AGENT 3 EXECUTION PLAN: Pillar 2 Lead (Gamified Symptom Screening Hub)

> **Agent Identity**: Cognitive Game Designer & Assessment Engineer  
> **Target Subsystem**: Pillar 2 (Interactive Cognitive Screening, Indicative $X/10$ Scorecard & Medical Disclaimer)  
> **Output Deliverables**: Fully playable `MentalDetectorGames.tsx`, `OnlineEra.tsx`, and `gameService.ts`  

---

## 1. Exclusive File Ownership & Boundaries

### Authorized Write Paths (Exclusive to Agent 3)
- `d:\BridgeCare\apps\Main\src\Pages\Portal\MentalDetectorGames.tsx`
- `d:\BridgeCare\apps\Main\src\Pages\Portal\OnlineEra.tsx`
- `d:\BridgeCare\apps\Main\src\services\gameService.ts`

### Strictly Off-Limits
- `apps/Main/src/Pages/Portal/AiChat.tsx` & `AiReports.tsx` (Agent 2).
- `apps/Main/src/Pages/Portal/TherapistsDirectory.tsx` (Agent 4).
- `apps/Main/src/Pages/Portal/Community*.tsx` (Agent 5).
- `appwrite/functions/*` (Agent 1).

---

## 2. Responsibilities & Deliverables

1. **Create `src/services/gameService.ts`**:
   - Telemetry capture state machine: records timestamped clicks, reaction latencies, distractor errors, and rule-switch delays.
   - Mathematical algorithm converting raw telemetry into $X/10$ Indicative Scores:
     * Attention & Hyperactivity (ADHD): $1$–$10$
     * Mood & Energy Fluctuation (Bipolar / Depression): $1$–$10$
     * Pattern & Checking Compulsions (OCD): $1$–$10$
   - Persistence helper: `saveScreeningScore(userId, gameType, score, telemetry, interpretationKey)` saving into Appwrite `SCREENING_SCORES`.
2. **Implement Interactive Game Canvas in `MentalDetectorGames.tsx`**:
   - **Track 1 (Attention & Activity — "Starlight Focus & Shift")**:
     * 180s interactive HTML5 canvas / SVG game.
     * Target: Gold stars with chime; Distractor: Red/Purple stars.
     * Measures omission and commission errors, reaction time standard deviation ($\sigma_{\text{RT}}$).
   - **Track 2 (Mood & Emotion — "Weather Within")**:
     * Atmospheric visual storytelling game.
     * Timed emotional choices measuring anhedonia and energy volatility.
   - **Track 3 (Pattern & Behavior — "Harmony & Chaos")**:
     * Geometric tile symmetry puzzle measuring checking frequency and asymmetry tolerance.
3. **Indicative Scorecard UI & Clinical Clarity**:
   - Render circular progress meters with large tabular numerals: **`7/10`**, **`6/10`**, **`3/10`**.
   - Explain what each score suggests in warm, stigma-free language.
4. **Mandatory Medical Disclaimer Enforcement**:
   - Prominently display the orange alert box emphasizing that scores are "initial screening and decision-support indicators", while final diagnosis belongs strictly to licensed physicians.
5. **Bridge to Doctor Booking**:
   - Include the "Add Scores to My Ready Doctor File" toggle.
   - Include the "Find Specialists in These Traits" CTA button linking to `/sessions/therapists`.

---

## 3. Step-by-Step Implementation Sequence

### Phase 1: Create `src/services/gameService.ts`
```typescript
import { Client, Databases, ID } from "appwrite";

export interface GameTelemetry {
  reactionTimes: number[];
  errors: number;
  switches: number;
  durationMs: number;
}

export function computeScore(telemetry: GameTelemetry, gameType: "attention" | "mood" | "pattern"): number {
  if (telemetry.reactionTimes.length === 0) return 5;
  const avgRt = telemetry.reactionTimes.reduce((a, b) => a + b, 0) / telemetry.reactionTimes.length;
  if (gameType === "attention") {
    // High variance + high impulse errors = higher ADHD likelihood indicator
    const raw = (telemetry.errors * 1.5) + (avgRt > 400 ? 3 : 1);
    return Math.min(10, Math.max(1, Math.round(raw)));
  }
  return 5;
}

export async function persistGameResult(userId: string, gameType: string, score: number, telemetry: GameTelemetry) {
  const client = new Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("6adaf3cd000458c04102");
  const db = new Databases(client);

  return await db.createDocument("main", "SCREENING_SCORES", ID.unique(), {
    scoreId: ID.unique(),
    userId,
    gameType,
    scoreNumerator: score,
    scoreDenominator: 10,
    telemetryMetrics: JSON.stringify(telemetry),
    completedAt: new Date().toISOString(),
  });
}
```

### Phase 2: Refactor `MentalDetectorGames.tsx`
- Replace static previews with interactive playable game canvas loops.
- Add sound effects (synthesized Web Audio API chimes, no external asset dependencies).
- Add pause, exit, and restart controls.
- On game completion, auto-transition to the Scorecard screen with the $X/10$ gauge.

### Phase 3: Enhance `OnlineEra.tsx`
- Connect questionnaire fallback flow so patients who prefer structured assessment can complete the digital screening smoothly.

---

## 4. Verification & Testing Protocol

- Run `npx tsc --noEmit` from `apps/Main`.
- Play through all 3 mini-games and ensure score calculation renders without NaN or layout shift.
- Confirm medical disclaimer is visible and legible in both Light and Night modes.
- Verify that clicking "Find Specialists" navigates to `/sessions/therapists`.
