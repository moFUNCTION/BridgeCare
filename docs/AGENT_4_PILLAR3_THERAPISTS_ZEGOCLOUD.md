# AGENT 4 EXECUTION PLAN: Pillar 3 Lead (Therapists, Booking, ZEGOCLOUD & Clinical File)

> **Agent Identity**: Clinical Systems & WebRTC Telehealth Engineer  
> **Target Subsystem**: Pillar 3 (Therapist Directory, Pre-Session Clinical File, Booking & ZEGOCLOUD Video Rooms)  
> **Output Deliverables**: `TherapistsDirectory.tsx`, `LatestSessions.tsx`, `Billing.tsx`, `zegocloudService.ts`, and `clinicalFileService.ts`  

---

## 1. Exclusive File Ownership & Boundaries

### Authorized Write Paths (Exclusive to Agent 4)
- `d:\BridgeCare\apps\Main\src\Pages\Portal\TherapistsDirectory.tsx`
- `d:\BridgeCare\apps\Main\src\Pages\Portal\LatestSessions.tsx`
- `d:\BridgeCare\apps\Main\src\Pages\Portal\Billing.tsx`
- `d:\BridgeCare\apps\Main\src\services\zegocloudService.ts`
- `d:\BridgeCare\apps\Main\src\services\clinicalFileService.ts`

### Strictly Off-Limits
- `apps/Main/src/Pages/Portal/AiChat.tsx` & `AiReports.tsx` (Agent 2).
- `apps/Main/src/Pages/Portal/MentalDetectorGames.tsx` (Agent 3).
- `apps/Main/src/Pages/Portal/Community*.tsx` (Agent 5).
- `appwrite/functions/*` (Agent 1).

---

## 2. Responsibilities & Deliverables

1. **Create `src/services/zegocloudService.ts`**:
   - Calls Appwrite Cloud Function `zegocloud-token-generator` to obtain signed room tokens.
   - Initializes ZEGOCLOUD 1-on-1 WebRTC Video Room inside a target container.
   - Handles audio/video toggle, screen sharing, and graceful disconnection.
2. **Create `src/services/clinicalFileService.ts`**:
   - Reads patient's daily transcripts from `TRANSCRIPTS` and game scores from `SCREENING_SCORES`.
   - Generates the Pre-Session Clinical Brief and writes to `CLINICAL_FILES` collection with patient consent.
3. **Upgrade `TherapistsDirectory.tsx`**:
   - Lists verified licensed clinicians from Appwrite `THERAPISTS` (with fallback doctor data).
   - Filter by specialty (ADHD, Anxiety, Bipolar, OCD, PTSD) using horizontal Chakra `ScrollArea`.
   - Implement the "Pre-Session Clinical File Review" consent modal during booking.
4. **Upgrade `LatestSessions.tsx`**:
   - Embeds the ZEGOCLOUD video call frame.
   - Side-by-side **Shared Session Context** panel displaying:
     * Last 7 days mood shifts and top triggers.
     * Indicative Game Scores ($7/10$ Attention, $6/10$ Mood).
     * Past Session notes (Session 1 through Session 8 memory continuity).
5. **Upgrade `Billing.tsx`**:
   - Interactive financial savings calculator:
     > *"By attaching your Ready Doctor File, you bypassed 3 exploratory sessions and saved \$450."*
   - Receipt generation and transaction history.

---

## 3. Step-by-Step Implementation Sequence

### Phase 1: Install ZEGOCLOUD & Build `zegocloudService.ts`
Ensure `@zegocloud/zego-uikit-prebuilt` is present in `apps/Main/package.json`:
```bash
npm install @zegocloud/zego-uikit-prebuilt
```
Implement `initializeZegoConsultation(container, roomId, userId, userName, role, onLeave)` following the code in `docs/04_PILLAR_3_THERAPISTS_ZEGOCLOUD_AND_CLINICAL_FILE_PLAN.md`.

### Phase 2: Build `src/services/clinicalFileService.ts`
```typescript
import { Client, Databases, ID } from "appwrite";

export interface ClinicalDossier {
  executiveSummary: string;
  chiefComplaints: string[];
  gameScores: Record<string, number>;
  patientGoals: string;
}

export async function createPreSessionFile(patientId: string, therapistId: string, dossier: ClinicalDossier) {
  const client = new Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("6adaf3cd000458c04102");
  const db = new Databases(client);

  return await db.createDocument("main", "CLINICAL_FILES", ID.unique(), {
    fileId: ID.unique(),
    patientId,
    therapistId,
    executiveSummary: dossier.executiveSummary,
    longitudinalTimelineJson: JSON.stringify(dossier.chiefComplaints),
    gameScorecardJson: JSON.stringify(dossier.gameScores),
    patientGoals: dossier.patientGoals,
    status: "shared",
    createdAt: new Date().toISOString(),
  });
}
```

### Phase 3: Wire Consultation View in `LatestSessions.tsx`
- Provide tab switcher: `Upcoming Sessions`, `Live Consultation`, and `Historical Dossiers`.
- In `Live Consultation`, mount the ZEGOCLOUD frame in the left panel and the patient's longitudinal transcript log in the right panel.

---

## 4. Verification & Testing Protocol

- Run `npx tsc --noEmit` from `apps/Main`.
- Verify that clicking "Book Consult" in `TherapistsDirectory.tsx` prompts the Pre-Session Clinical File consent modal.
- Verify that joining a session initializes the video frame without crashing.
- Confirm savings meter in `Billing.tsx` calculates accurate monetary savings ($300–$600).
