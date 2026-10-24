# AGENT 1 EXECUTION PLAN: Backend, Appwrite Architecture & Cloud Functions

> **Agent Identity**: Backend & Cloud Security Architect  
> **Target Subsystem**: Appwrite Database Collections, Permissions & Cloud Functions  
> **Output Deliverables**: Complete `appwrite.json` schemas + 5 production Node.js cloud functions  

---

## 1. Exclusive File Ownership & Boundaries

### Authorized Write Paths (Exclusive to Agent 1)
- `d:\BridgeCare\appwrite\appwrite.json`
- `d:\BridgeCare\appwrite\functions\groq-chat-companion\`
- `d:\BridgeCare\appwrite\functions\zegocloud-token-generator\`
- `d:\BridgeCare\appwrite\functions\groq-community-moderator\`
- `d:\BridgeCare\appwrite\functions\groq-clinical-brief-compiler\`
- `d:\BridgeCare\appwrite\functions\register-doctor\`

### Strictly Off-Limits
- Any file in `apps/Main/src/Pages/Portal/*` (Owned by Agents 2, 3, 4, 5).
- Any file in `apps/Main/src/components/*` (Owned by Frontend Agents).

---

## 2. Responsibilities & Deliverables

1. **Database Schema Enforcement**:
   - Update `appwrite.json` with the 8 collections defined in `01_APPWRITE_BACKEND_AND_SECURITY_PLAN.md`:
     `USERS`, `TRANSCRIPTS`, `SCREENING_SCORES`, `CLINICAL_FILES`, `THERAPISTS`, `SESSIONS`, `COMMUNITY_POSTS`, `COMMUNITY_COMMENTS`.
   - Configure Document Security (`documentSecurity: true`) on all collections.
   - Enforce Vault A vs. Vault B permissions.
2. **Implement Cloud Function 1: `groq-chat-companion`**:
   - Node.js 18 microservice invoking Groq Cloud API (`llama-3.3-70b-versatile`).
   - Receives `{ messages, ventingMode, language, userId }`.
   - Detects crisis markers (`[CRISIS_DETECTED]`) and returns sanitized payload.
3. **Implement Cloud Function 2: `zegocloud-token-generator`**:
   - Generates HMAC-SHA256 tokens using `ZEGO_APP_ID` and `ZEGO_SERVER_SECRET`.
   - Inputs: `{ roomId, userId, role }` -> Returns: `{ token, appId, roomId, userId, expiresIn: 7200 }`.
4. **Implement Cloud Function 3: `groq-community-moderator`**:
   - High-speed content screening using Groq JSON Mode.
   - Inputs: `{ content, conditionSpace }` -> Returns: `{ isSafe: boolean, flagReason: string, explanation: string }`.
5. **Implement Cloud Function 4: `groq-clinical-brief-compiler`**:
   - Synthesizes transcripts + game screening scores into a Pre-Session Clinical Brief.
   - Inputs: `{ patientId, therapistId }` -> Returns: JSON Pre-Session Clinical Dossier.

---

## 3. Step-by-Step Implementation Sequence

### Phase 1: Update `appwrite/appwrite.json` Tables
Add the collection definitions and function declarations to `appwrite/appwrite.json`:
- Ensure attributes match the exact specifications from `docs/01_APPWRITE_BACKEND_AND_SECURITY_PLAN.md`.
- Register function configurations:
  ```json
  {
    "$id": "groq-chat-companion",
    "name": "Groq AI Chat Companion",
    "runtime": "node-18.0",
    "path": "functions/groq-chat-companion",
    "entrypoint": "src/main.js",
    "execute": ["users", "any"],
    "enabled": true,
    "timeout": 15
  },
  {
    "$id": "zegocloud-token-generator",
    "name": "ZEGOCLOUD Room Token Generator",
    "runtime": "node-18.0",
    "path": "functions/zegocloud-token-generator",
    "entrypoint": "src/main.js",
    "execute": ["users"],
    "enabled": true,
    "timeout": 15
  },
  {
    "$id": "groq-community-moderator",
    "name": "Groq Community Moderation Shield",
    "runtime": "node-18.0",
    "path": "functions/groq-community-moderator",
    "entrypoint": "src/main.js",
    "execute": ["users"],
    "enabled": true,
    "timeout": 15
  },
  {
    "$id": "groq-clinical-brief-compiler",
    "name": "Groq Pre-Session Clinical Brief Compiler",
    "runtime": "node-18.0",
    "path": "functions/groq-clinical-brief-compiler",
    "entrypoint": "src/main.js",
    "execute": ["users"],
    "enabled": true,
    "timeout": 30
  }
  ```

### Phase 2: Create Microservice Folders & Code
For each function, create:
1. `package.json` with dependencies (`node-appwrite`, `node-fetch` if needed).
2. `src/main.js` following the implementation blueprints in `01_APPWRITE_BACKEND_AND_SECURITY_PLAN.md`.

---

## 4. Verification & Testing Protocol

- Verify JSON validity of `appwrite/appwrite.json`.
- In each function directory, run:
  ```bash
  node -e "require('./src/main.js')"
  ```
- Ensure all function handlers export an `async ({ req, res, log, error })` signature compatible with Appwrite Node.js 18 runtime.
