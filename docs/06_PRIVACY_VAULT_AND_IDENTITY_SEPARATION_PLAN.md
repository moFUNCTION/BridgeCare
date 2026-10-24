# Privacy Vault, Identity Separation & Cryptographic Governance Plan

> **Document Status**: Production Blueprint  
> **Target Audience**: AI Agents, Security Architects & Backend Developers  
> **Core Components**: `PasswordSecurity.tsx`, `UserProfile.tsx`, `UserSettings.tsx`  
> **Mandatory Rule**: Strategic Guideline 3 (Strict Data Privacy & Identity Separation)  

---

## 1. The Core Privacy Principle: Zero Leaks Between Identity & Emotions

Mental health data is among the most sensitive personal information in existence. Fear of employer discovery, social shame, or data leaks causes millions of patients to avoid seeking help.

BridgeCare solves this through **Dual-Vault Architecture**:
1. **Vault A (Identity & Financial Infrastructure)**: Stores the user's legal name, email, billing cards, and verified doctor licenses.
2. **Vault B (Encrypted Clinical Sanctuary)**: Stores daily AI companion venting logs, mood shifts, game telemetry, and community posts.
3. **Cryptographic Air-Gap**: Vault A and Vault B reside in decoupled database structures. A compromise of community posts or chat logs reveals **zero real names or emails**.

---

## 2. Vault Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                                BRIDGECARE CLOUD                               |
+---------------------------------------+---------------------------------------+
|          VAULT A: IDENTITY            |          VAULT B: SANCTUARY           |
|         (Strict Legal Access)         |       (Zero PII / Encrypted)          |
+---------------------------------------+---------------------------------------+
| * Real Email & Phone                  | * Daily Venting Transcripts           |
| * Legal Billing & Invoices            | * Longitudinal Mood Trajectories      |
| * Medical License Numbers             | * Gamified Screening Telemetry (7/10) |
| * Identity Verification Badges        | * Anonymous Community Pseudonyms      |
| * Hashed Authentication Secrets       | * Pre-Session Clinical Briefs         |
+---------------------------------------+---------------------------------------+
                                    |
                        [PATIENT CONSENT BRIDGE]
            * Explicit 1-click authorization per booking
            * Scoped, time-bounded access granted to Doctor
            * Instant 1-click revocation capability
```

---

## 3. Scoped Doctor Access & Instant Revocation

When a patient books a session with a therapist:
1. An encrypted permission token is written to Appwrite `CLINICAL_FILES`.
2. The therapist receives read access to the Pre-Session Brief starting **48 hours before** the appointment time.
3. Access automatically expires **7 days after** the session unless an active treatment plan is continued.
4. **1-Click Revoke**: In `PasswordSecurity.tsx`, the patient sees a live list of authorized doctors with an immediate "Revoke Access" button.

### Revoke Access Implementation (`src/services/privacyService.ts`)
```typescript
import { Client, Databases } from "appwrite";

export async function revokeDoctorAccess(fileId: string, therapistId: string): Promise<boolean> {
  const client = new Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("6adaf3cd000458c04102");

  const db = new Databases(client);

  try {
    await db.updateDocument(
      "main",
      "CLINICAL_FILES",
      fileId,
      {
        status: "revoked",
        revokedAt: new Date().toISOString(),
      },
      // Remove therapist from document permissions
      []
    );
    return true;
  } catch (err) {
    console.error("Failed to revoke doctor access:", err);
    return false;
  }
}
```

---

## 4. Patient Data Autonomy & Control

In `src/Pages/Portal/PasswordSecurity.tsx`, three critical patient autonomy controls are surfaced:

### 1. Download Complete Archive (Data Portability)
- Generates a single encrypted JSON / PDF bundle containing:
  - All historical daily transcripts.
  - Longitudinal mood and trigger graphs.
  - Gamified screening scorecards ($X/10$ metrics).
  - Doctor consultation summaries.
- Allows patients to take their full psychiatric history to any outside clinician without platform lock-in.

### 2. Immediate History Purge (Right to be Forgotten)
- Permanently deletes all records from `TRANSCRIPTS` and `SCREENING_SCORES` belonging to the patient's `userId`.
- Uses Appwrite server-side batch deletion. Once confirmed with password/passkey re-authentication, the data is irreversibly wiped.

```typescript
export async function purgeChatAndScreeningHistory(userId: string): Promise<boolean> {
  const client = new Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("6adaf3cd000458c04102");

  const db = new Databases(client);

  try {
    // 1. Delete all transcripts
    const transcripts = await db.listDocuments("main", "TRANSCRIPTS", []);
    for (const doc of transcripts.documents) {
      if (doc.userId === userId) {
        await db.deleteDocument("main", "TRANSCRIPTS", doc.$id);
      }
    }

    // 2. Delete all game screening scores
    const scores = await db.listDocuments("main", "SCREENING_SCORES", []);
    for (const doc of scores.documents) {
      if (doc.userId === userId) {
        await db.deleteDocument("main", "SCREENING_SCORES", doc.$id);
      }
    }

    return true;
  } catch (err) {
    console.error("Purge failed:", err);
    return false;
  }
}
```

### 3. Emergency Crisis Contact Management
- Patients can optionally designate a trusted family member or close friend.
- **Safety Rule**: This contact is never contacted during ordinary venting. They are only triggered if the patient explicitly authorizes emergency outreach in the Crisis Intervention modal.

---

## 5. Security & Verification Checklist for AI Agents

- [ ] Verify that no API route or Appwrite query ever returns real email or phone number in community responses.
- [ ] Ensure `TRANSCRIPTS` and `SCREENING_SCORES` collections have `documentSecurity: true` and are scoped strictly to `Role.user(userId)`.
- [ ] Verify that doctor access to `CLINICAL_FILES` requires explicit patient consent toggle during the booking flow.
- [ ] Confirm that "Revoke Access" in `PasswordSecurity.tsx` successfully clears permissions from the Appwrite document.
- [ ] Confirm that "Purge History" deletes all records from `TRANSCRIPTS` and `SCREENING_SCORES`.
- [ ] Validate that the "Download Archive" button packages all transcripts into a formatted JSON file download.
