# Pillar 2 Implementation Plan: Gamified Symptom Screening Hub (Stigma-Free Assessment)

> **Document Status**: Production Blueprint  
> **Target Audience**: AI Agents & Frontend Game/UI Developers  
> **Core Component**: `MentalDetectorGames.tsx`, `OnlineEra.tsx`  
> **Philosophy**: Stigma-free, gamified symptom screening covering all psychological conditions  

---

## 1. Core Philosophy & Clinical Innovation

Traditional psychiatric questionnaires (such as PHQ-9, GAD-7, ASRS) often intimidate patients, trigger test anxiety, and prompt social desirability bias where patients minimize symptoms to avoid embarrassment.

BridgeCare replaces cold questionnaires with **interactive cognitive mini-games**:
1. **Stress-Free & Non-Intrusive**: Patients interact with engaging visual puzzles and rhythm challenges.
2. **Objective Telemetry**: Instead of asking *"Do you lose focus easily?"*, the game measures actual reaction time variance, impulse clicks, and distraction recovery times.
3. **Indicative Grading Scale ($X/10$)**: Outputs an easy-to-understand likelihood indicator (e.g., $7/10$ Attention & Activity Indicator, $3/10$ Pattern/OCD Indicator).
4. **Mandatory Medical Disclaimer**: Explicitly states that game scores are decision-support indicators for licensed physicians, not a definitive diagnosis.

---

## 2. The 3 Core Screening Game Tracks

```
Gamified Screening Hub (MentalDetectorGames.tsx)
├── Track A: Attention & Activity ("Starlight Focus & Shift")
│   └── Screens for: ADHD, focus sustainment, impulse control, task switching
├── Track B: Mood & Emotion ("Weather Within")
│   └── Screens for: Bipolar mood shifts, depression depth, anxiety spikes
└── Track C: Pattern & Behavior ("Harmony & Chaos")
    └── Screens for: OCD loops, symmetry compulsion, tolerance of uncertainty
```

---

## 3. Game Mechanics & Telemetry Specifications

### Game 1: "Starlight Focus & Shift" (Attention & ADHD Screening)
- **Duration**: 180 seconds.
- **Visual Mechanic**: Dynamic celestial stars illuminate on an interactive canvas.
  - Target: Gold stars appear with subtle audio chime.
  - Distractor: Purple/Red pulse stars appear in peripheral vision.
  - Switch Cue: Ring color shifts, requiring user to invert target criteria.
- **Telemetry Captured**:
  - `reactionTimeMean` (ms): Average baseline latency to target.
  - `reactionTimeStdDev` (ms): Standard deviation (variability indicates focus lapses).
  - `commissionErrors`: Clicks on distractor stars (indicates motor impulsivity).
  - `omissionErrors`: Missed gold targets (indicates attention drift).
  - `switchCost` (ms): Reaction delay immediately following rule inversion.
- **Scoring Formula**:
  $$\text{Score} = \text{round}\left(10 \times \left(0.35 \frac{\sigma_{\text{RT}}}{250} + 0.35 \frac{\text{Errors}_{\text{impulse}}}{N_{\text{distractors}}} + 0.30 \frac{\text{SwitchCost}}{400}\right)\right)$$
  Clamped between $1$ and $10$. E.g., output: **$7/10$ Attention Indicator**.

---

### Game 2: "Weather Within" (Mood & Energy Screening)
- **Duration**: 120 seconds.
- **Visual Mechanic**: Visual atmospheric storytelling canvas.
  - User guides a character through changing weather biomes (Storm, Sunlight, Fog, Night).
  - Prompts require rapid aesthetic and emotional valence choices under timed and untimed conditions.
  - Energy slider: User calibrates personal vitality and emotional resonance.
- **Telemetry Captured**:
  - `valenceBias`: Tendency toward dark vs. bright stimuli under time pressure.
  - `hesitationOnPositive` (ms): Latency when presented with optimistic scenarios (marker for anhedonia/depression).
  - `volatilityIndex`: Frequency of extreme swings between high and low energy selections.
- **Output**: **$6/10$ Mood & Energy Fluctuation Indicator** (screens for Bipolar spectrum and depressive episodes).

---

### Game 3: "Harmony & Chaos" (Pattern & OCD Screening)
- **Duration**: 120 seconds.
- **Visual Mechanic**: Geometric tile puzzle with imperfect alignment and incomplete loops.
  - User can arrange tiles into harmonious patterns.
  - Deliberately introduces irreversible asymmetrical tiles.
  - Measures repetitive clicking, checking behavior, and frustration tolerance when leaving an incomplete loop.
- **Telemetry Captured**:
  - `checkingFrequency`: Repeated clicks on already locked/arranged tiles.
  - `intoleranceToAsymmetry`: Time spent attempting to fix intentionally unfixable irregularities.
  - `exitHesitation`: Delay before clicking "Done / Submit" on an imperfect pattern.
- **Output**: **$3/10$ Pattern & Checking Indicator** (low likelihood of OCD traits).

---

## 4. Indicative Scorecard UI & Medical Disclaimer

In `src/Pages/Portal/MentalDetectorGames.tsx` and `src/Pages/Portal/OnlineEra.tsx`:

### Visual Display
- **Circular Progress Gauges**: Rendered with soft amber (`#f59e0b`) or calming sage teal (`#2a7b76`).
- **Score Representation**: Large tabular numeral: **`7/10`**.
- **Descriptive Clarification**:
  > *"Your reaction profile indicates elevated focus drift and impulse responsiveness ($7/10$), consistent with characteristics often seen in ADHD. This is an objective cognitive profile, not a flaw."*

### Mandatory Medical Disclaimer Banner
Every scorecard component must include this explicit disclaimer:
```tsx
<Box
  p="4"
  borderRadius="2xl"
  bg="orange.500/10"
  borderWidth="1px"
  borderColor="orange.500/30"
>
  <HStack gap="3" align="start">
    <LuShieldAlert size={20} color="#ea580c" style={{ flexShrink: 0, marginTop: "2px" }} />
    <Stack gap="1">
      <Text fontWeight="bold" fontSize="xs" color="orange.600">
        {t("games.disclaimerTitle", "Official Medical Disclaimer")}
      </Text>
      <Text fontSize="2xs" color="fg.muted" lineHeight="tall">
        {t("games.disclaimerText", "Game scores and telemetry serve exclusively as initial screening and clinical decision-support indicators. Final diagnosis, psychological evaluation, and medical prescriptions remain the sole legal and clinical responsibility of licensed psychiatrists and physicians.")}
      </Text>
    </Stack>
  </HStack>
</Box>
```

---

## 5. Appwrite Data Persistence

When a game completes, the results are saved to the `SCREENING_SCORES` collection in Appwrite:

```typescript
import { Client, Databases, ID } from "appwrite";

export async function saveGameScreeningScore(
  userId: string,
  gameType: "attention" | "mood" | "pattern",
  scoreNumerator: number,
  telemetry: Record<string, any>,
  interpretationKey: string
) {
  const client = new Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("6adaf3cd000458c04102");

  const db = new Databases(client);

  return await db.createDocument(
    "main",
    "SCREENING_SCORES",
    ID.unique(),
    {
      scoreId: ID.unique(),
      userId,
      gameType,
      scoreNumerator,
      scoreDenominator: 10,
      telemetryMetrics: JSON.stringify(telemetry),
      interpretationKey,
      completedAt: new Date().toISOString(),
    }
  );
}
```

---

## 6. Seamless Bridge to Pillar 3 (Therapist Booking)

At the bottom of the Scorecard, two primary action buttons link the assessment directly to clinical care:
1. **"Add Scores to My Ready Doctor File"** (Toggle switch, persists in patient's upcoming pre-session brief).
2. **"Find Specialists in These Traits"** (Deep-links to `/sessions/therapists?specialty=ADHD`, pre-filtering doctors who specialize in the patient's elevated indicator).
