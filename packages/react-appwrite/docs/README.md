# `@repo/react-appwrite` Documentation

Welcome to the comprehensive documentation for **`@repo/react-appwrite`**—a production-grade React library providing reactive hooks, components, and zero-re-fetch realtime sync for the Appwrite Web SDK.

---

## 📚 Table of Contents

| Guide | Description | Key Hooks & Components |
|---|---|---|
| [**1. Core Provider & Cache Engine**](./PROVIDER.md) | Setting up AppwriteContext, global error handling, and the Cache Fusion Engine. | `AppwriteProvider`, `useAppwrite`, `CacheFusionStore` |
| [**2. Authentication & Sessions**](./AUTH.md) | User authentication, multi-session swapper, MFA, and profile management. | `useUser`, `useAuthActions`, `useMFA`, `useAccountSwitcher`, `useAccountSettings` |
| [**3. Databases & Realtime Queries**](./DATABASES.md) | Unified collection queries, infinite scroll, optimistic mutations, and relationship queries. | `useCollection`, `useInfiniteCollection`, `useDocument`, `useRelatedDocuments`, `useMutations`, `useRealtimeCollection` |
| [**4. Storage & Media**](./STORAGE.md) | Multi-file chunked uploads, image transformations, responsive component, and downloads. | `useUpload`, `useFileUrl`, `<AppwriteImage>`, `useFileDownload` |
| [**5. Teams, RBAC & Permissions**](./TEAMS.md) | Team management, invitations, client-side RBAC, and declarative guard components. | `useTeams`, `useTeamMembers`, `usePermissions`, `<RequireAuth>`, `<HasRole>`, `<HasTeam>` |
| [**6. Serverless Cloud Functions**](./FUNCTIONS.md) | Executing Appwrite functions, payload handling, duration tracking, and response parsing. | `useAppwriteFunction` |
| [**7. Messaging & Web Push**](./MESSAGING.md) | Web push notifications permissions and target registrations. | `useMessaging` |
| [**8. Utilities & Helpers**](./UTILITIES.md) | Realtime user presence, dynamic avatars, QR codes, and locale information. | `usePresence`, `useAvatars`, `useLocale` |
| [**9. TypeScript Schema CLI**](./CLI.md) | Automated TypeScript interface generation from Appwrite database schemas. | `appwrite-react-gen` |

---

## 🏗️ Architecture Overview

```
Application Root (<AppwriteProvider>)
  ├── Cache Fusion Engine (In-Memory Realtime Store & Zero Re-Fetch Sync)
  ├── Global Service Instances (Account, Databases, Storage, Functions, Teams, Messaging, Avatars, Locale)
  └── Multi-Session Manager (localStorage Session Secret Registry)
```
