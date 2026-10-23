# BridgeCare 🩺🧠
### *Comprehensive, Stigma-Free Mental Health & Support Ecosystem*

[![React 18](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-orange.svg)](https://turbo.build/)
[![Chakra UI](https://img.shields.io/badge/Chakra_UI-v3-teal.svg)](https://chakra-ui.com/)
[![Appwrite](https://img.shields.io/badge/Backend-Appwrite_Cloud-fd366e.svg)](https://appwrite.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Overview

**BridgeCare** is a modern, stigma-free mental health ecosystem designed to bridge the gap between daily emotional wellness and licensed psychiatric care. 

Traditional mental healthcare often suffers from lengthy diagnostic delays, prohibitive costs for introductory exploration, social stigma around clinical questionnaires, and loss of critical day-to-day context between therapy sessions. 

BridgeCare transforms this experience by offering:
- An empathetic **24/7 AI Venting Companion** that creates longitudinal summaries.
- Engaging, stigma-free **Gamified Symptom Screening**.
- A **Pre-Session Clinical File** that saves patients 3–5 costly exploratory sessions.
- An **Anonymous Peer Support Community** protected by automated safety moderation.
- A **Crisis Intervention System** accessible in one click from anywhere in the app.

---

## 🚀 The 4 Core Pillars

```
                     ┌─────────────────────────────────────────┐
                     │               BridgeCare                │
                     │       Mental Healthcare Ecosystem       │
                     └────────────────────┬────────────────────┘
                                          │
       ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
       │                  │                               │                  │
       ▼                  ▼                               ▼                  ▼
┌──────────────┐  ┌──────────────┐                ┌──────────────┐  ┌──────────────────┐
│   Pillar 1   │  │   Pillar 2   │                │   Pillar 3   │  │     Pillar 4     │
│  24/7 AI     │  │  Gamified    │                │  Therapist   │  │  Safe Anonymous  │
│  Venting     │  │  Symptom     │                │  Ready File  │  │  Peer Community  │
│  Companion   │  │  Screening   │                │  Integration │  │  & Moderation    │
└──────────────┘  └──────────────┘                └──────────────┘  └──────────────────┘
```

### 1. 🤖 24/7 AI Daily Venting Companion & Longitudinal Transcripts
- **Free-Form Venting**: Users can talk, chat, and vent naturally about triggers, emotions, and life events at any hour.
- **Automated Clinical Transcripts**: Generates objective mood summaries, trigger tags, and cognitive distortions without requiring tedious manual journaling.
- **Bynara AI & Multi-Model Engine**: Employs warm, conversational empathy specifically tuned to respect clinical boundaries and validate user emotions.

### 2. 🎮 Gamified Symptom Screening (Stigma-Free)
- **Play Instead of Intimidating Forms**: Replaces cold clinical questionnaires with interactive, science-backed micro-games:
  - **Attention & Focus Matrix**: Evaluates focus and cognitive dispersion (ADHD screening).
  - **Emotional Balance & Resonance**: Gauges mood volatility and depressive/anxious markers.
  - **Pattern & Behavior Explorer**: Detects repetitive tendencies and cognitive loops.
  - **Online ERA Experience**: Reflex and emotional state tracking.
- **Indicative Scores**: Delivers non-pathologizing indicative scores (e.g., $7/10$ likelihood index) paired with clear medical decision-support context.

### 3. 🩺 Therapist Integration & The "Pre-Session Clinical Brief"
- **Session 1 Treatment Readiness**: Compiles longitudinal AI venting summaries and game screening scores into a structured **Pre-Session Clinical Brief** sent directly to the licensed doctor before the first appointment.
- **Financial & Time Relief**: Saves patients the cost and exhaustion of 3 to 5 preliminary exploratory sessions.
- **Longitudinal Memory Continuity**: Doctors can review week-over-week trends, preventing the loss of vital context by Session 8 and beyond.

### 4. 🛡️ Safe & Anonymous Peer Community
- **Identity Isolation**: Total separation of legal billing identities from pseudonym community aliases. Real names are never exposed.
- **Real-Time AI Moderation**: Built-in automated sentiment and toxicity filtering to prevent bullying, triggering language, and harassment.
- **Community Feed & Viral Trends**: Allows users to share personal victories, seek peer support, and exchange coping strategies.

---

## 🚨 Safety & Clinical Compliance

> [!IMPORTANT]
> **Medical Disclaimer**: All screening scores, game outcomes, and AI companion conversations are intended strictly as initial screening and decision-support indicators. Final diagnosis, therapy, and pharmacological prescriptions remain the sole responsibility of licensed psychiatrists and doctors.

- **Immediate Crisis Hotline Pill**: A persistent top-level red emergency button accessible on all pages. One click opens instant hotline numbers (e.g., 988, local mental health emergency services, and breathing grounding tools).
- **Automated Crisis Protocol**: If crisis or self-harm keywords are detected during conversation, the UI immediately displays emergency intervention resources.

---

## 🏗️ Architecture & Monorepo Structure

BridgeCare is organized as a high-performance **Turborepo** monorepo:

```
BridgeCare/
├── apps/
│   └── Main/                     # Primary Web Application (Patient & Portal)
│       ├── src/
│       │   ├── components/       # BranchedMenu, PortalLayout, CrisisHotlineModal, LanguageToggle
│       │   ├── Pages/
│       │   │   ├── Auth/         # Login, Register, VerifyEmail (OTP & code slots), ForgotPassword
│       │   │   ├── Portal/       # UserProfile, UserSettings, PasswordSecurity
│       │   │   │                 # AiChat, AiReports, MentalDetectorGames, OnlineEra
│       │   │   │                 # CommunityPosts, CommunityViral, CommunityNotifications
│       │   │   │                 # TherapistsDirectory, LatestSessions, Billing
│       │   │   └── Dashboard.tsx # Main Overview Dashboard
│       │   ├── services/         # Appwrite, Bynara AI, Auth & Session services
│       │   ├── lib/              # Cookies & client-side security helpers
│       │   ├── i18n/             # Bilingual localization (English & Arabic)
│       │   └── theme/            # Chakra UI custom tokens, colors, & typography
│       └── vite.config.ts
├── packages/
│   ├── react-appwrite/           # React hooks, AuthProvider, Realtime subscriptions & SDK
│   ├── UI-components/            # Shared UI components (BranchedMenu, SplitText, CodeSlot, etc.)
│   ├── Assets/                   # Logos, SVG wave generators, and vector assets
│   ├── Data-shared/              # Shared TypeScript types, interfaces, and constants
│   ├── Hooks-shared/             # Reusable React hooks (MultiStepForm, Theme, ScreenBreakpoints)
│   ├── Utils-shared/             # Cross-package utility functions
│   └── typescript-config/        # Centralized tsconfig presets
├── turbo.json                    # Monorepo build pipeline orchestration
└── package.json                  # Root dependencies & scripts
```

---

## 🛠️ Tech Stack

| Domain | Technology |
|---|---|
| **Build & Monorepo** | [Turborepo](https://turbo.build/) + `npm` Workspaces |
| **Frontend Framework** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & Design System** | [Chakra UI v3](https://chakra-ui.com/) + Emotion + Framer Motion |
| **Backend & Database** | [Appwrite Cloud](https://appwrite.io/) (Auth, Databases, Realtime, Storage) |
| **AI Integration** | Bynara AI Client / Custom Neural LLM endpoints |
| **Icons & Typography** | [React Icons (`react-icons/lu`, `react-icons/ri`)](https://react-icons.github.io/react-icons/) + Plus Jakarta Sans & Inter |
| **Internationalization** | [i18next](https://www.i18next.com/) (Full English & Arabic RTL/LTR support) |
| **Routing** | [React Router v6](https://reactrouter.com/) |

---

## 🌐 Internationalization (i18n & RTL)

BridgeCare is built from the ground up with **first-class bilingual support**:
- **English (`en`)** & **Arabic (`ar`)**.
- Fully automated bidirectional layout switching (`dir="ltr"` and `dir="rtl"`).
- Dynamic mirrored layouts for the **Branched Menu**, sidebar panels, and interactive chat flows.
- Zero hardcoded UI strings; all messages, headings, and clinical labels are managed via structured localization catalogs in `apps/Main/src/i18n/locales/`.

---

## 🏁 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **npm**: `v9.0.0` or higher

### 1. Clone the Repository
```bash
git clone https://github.com/moFUNCTION/BridgeCare.git
cd BridgeCare
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the `.env.example` file in the root and in `apps/Main` to `.env`:
```bash
cp .env.example .env
```

Set your Appwrite credentials:
```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_COLLECTION_USERS=USERS
VITE_APPWRITE_TEAM_PATIENTS=Patients
```

### 4. Run Development Server
```bash
npm run dev
```

The application will start with Turborepo concurrency and will be accessible at:
👉 **`http://localhost:3000`**

### 5. Other Useful Commands
```bash
# Typecheck all packages and apps without emitting bundles
npx tsc --noEmit

# Lint code across the monorepo
npm run lint

# Format with Prettier
npm run format
```

---

## 🔒 Security, Privacy & Cookie Policy

- **Session & Email Verification Flow**: Supports full OTP verification, email tokens, and flexible user-controlled cookie flags (`bridgecare_skip_verify`) allowing users to tour and access their dashboard immediately while keeping security guards intact.
- **Encrypted Data Vaults**: Clinical files, doctor notes, and chat histories are isolated by user ID and database permissions with zero public read leakage.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <b>BridgeCare</b> — Bridging minds, doctors, and compassionate daily care.
</p>
