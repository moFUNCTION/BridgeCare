# AGENT 5 EXECUTION PLAN: Pillar 4 & Privacy Lead (Anonymous Community & Privacy Vault)

> **Agent Identity**: Community Trust & Cryptographic Privacy Specialist  
> **Target Subsystem**: Pillar 4 (Safe Anonymous Community, Groq Moderation Shield, Dual-Vault Governance)  
> **Output Deliverables**: `CommunityPosts.tsx`, `CommunityViral.tsx`, `CommunityNotifications.tsx`, `PasswordSecurity.tsx`, `UserProfile.tsx`, `UserSettings.tsx`, `communityService.ts`, and `privacyService.ts`  

---

## 1. Exclusive File Ownership & Boundaries

### Authorized Write Paths (Exclusive to Agent 5)
- `d:\BridgeCare\apps\Main\src\Pages\Portal\CommunityPosts.tsx`
- `d:\BridgeCare\apps\Main\src\Pages\Portal\CommunityViral.tsx`
- `d:\BridgeCare\apps\Main\src\Pages\Portal\CommunityNotifications.tsx`
- `d:\BridgeCare\apps\Main\src\Pages\Portal\PasswordSecurity.tsx`
- `d:\BridgeCare\apps\Main\src\Pages\Portal\UserProfile.tsx`
- `d:\BridgeCare\apps\Main\src\Pages\Portal\UserSettings.tsx`
- `d:\BridgeCare\apps\Main\src\services\communityService.ts`
- `d:\BridgeCare\apps\Main\src\services\privacyService.ts`

### Strictly Off-Limits
- `apps/Main/src/Pages/Portal/AiChat.tsx` & `AiReports.tsx` (Agent 2).
- `apps/Main/src/Pages/Portal/MentalDetectorGames.tsx` (Agent 3).
- `apps/Main/src/Pages/Portal/TherapistsDirectory.tsx` (Agent 4).
- `appwrite/functions/*` (Agent 1).

---

## 2. Responsibilities & Deliverables

1. **Create `src/services/communityService.ts`**:
   - Posts CRUD connected to Appwrite `COMMUNITY_POSTS`.
   - Comments CRUD connected to Appwrite `COMMUNITY_COMMENTS`.
   - Real-time Groq content screening hook calling `groq-community-moderator`.
   - Optimistic reaction incrementer (`relate`, `strength`, `helpful`).
2. **Create `src/services/privacyService.ts`**:
   - Doctor sharing revocation (`revokeDoctorAccess`).
   - Patient data archive export (generates downloadable JSON/bundle of transcripts and game metrics).
   - Irreversible chat and telemetry purge (`purgeChatAndScreeningHistory`).
3. **Upgrade `CommunityPosts.tsx`**:
   - Condition spaces filter tabs with horizontal Chakra `ScrollArea`.
   - Real-time Groq AI Safety Shield badge on composer (shows "Content Safe & Supportive").
   - Non-punitive coaching modal if post is flagged for bullying or unverified medical prescribing.
   - 3 empathetic reaction buttons: **Relate**, **Strength**, **Helpful**.
4. **Upgrade `CommunityViral.tsx` & `CommunityNotifications.tsx`**:
   - Viral stories feed sorted by reaction sum (`relateCount + strengthCount`).
   - Real-time notifications when a peer relates to or supports the user's post.
5. **Upgrade `PasswordSecurity.tsx`**:
   - Dual-Vault diagram (Vault A Identity vs. Vault B Sanctuary).
   - Active doctor sharing permissions table with working 1-click **Revoke Access** button.
   - Working **Download Complete Archive** and **Purge History** action buttons.
6. **Upgrade `UserProfile.tsx` & `UserSettings.tsx`**:
   - Anonymous alias generator (e.g., `"CalmRiver92"`) and soothing avatar picker.
   - Mathematical identity separation confirmation badge.

---

## 3. Step-by-Step Implementation Sequence

### Phase 1: Build `src/services/communityService.ts`
```typescript
import { Client, Databases, ID, Query } from "appwrite";

export interface CommunityPost {
  id: string;
  authorAlias: string;
  authorAvatar: string;
  conditionSpace: string;
  content: string;
  relateCount: number;
  strengthCount: number;
  helpfulCount: number;
  createdAt: string;
}

export async function fetchPosts(space: string = "all"): Promise<CommunityPost[]> {
  const client = new Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("6adaf3cd000458c04102");
  const db = new Databases(client);

  try {
    const queries = space !== "all" ? [Query.equal("conditionSpace", space)] : [];
    const res = await db.listDocuments("main", "COMMUNITY_POSTS", queries);
    return res.documents.map(d => ({
      id: d.$id,
      authorAlias: d.authorAlias,
      authorAvatar: d.authorAvatar,
      conditionSpace: d.conditionSpace,
      content: d.content,
      relateCount: d.relateCount || 0,
      strengthCount: d.strengthCount || 0,
      helpfulCount: d.helpfulCount || 0,
      createdAt: d.createdAt,
    }));
  } catch (err) {
    console.warn("Using community fallback:", err);
    return [];
  }
}
```

### Phase 2: Build `src/services/privacyService.ts`
Implement archive export and history purge functions as outlined in `docs/06_PRIVACY_VAULT_AND_IDENTITY_SEPARATION_PLAN.md`.

### Phase 3: Wire UI Components
- In `CommunityPosts.tsx`, hook the "Share Post" button to execute Groq moderation check before saving to Appwrite.
- In `PasswordSecurity.tsx`, wire the "Download Archive" button to create and trigger a client-side JSON file download (`bridgecare-clinical-archive.json`).
- Wire the "Purge History" button with a confirmation dialog before executing document deletion.

---

## 4. Verification & Testing Protocol

- Run `npx tsc --noEmit` from `apps/Main`.
- Verify that posting in `CommunityPosts.tsx` validates content through the moderation shield.
- Verify that clicking "Revoke Access" in `PasswordSecurity.tsx` successfully revokes doctor access.
- Confirm that the "Download Archive" button downloads a valid JSON payload containing transcripts.
- Ensure no real email or personal user ID is exposed in the public community feed.
