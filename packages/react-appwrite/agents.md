# @repo/react-appwrite — AI Agent Reference & Complete Developer Manual

> **Purpose**: This document is an exhaustive, single-file reference for `@repo/react-appwrite`. It provides autonomous AI agents and developers with complete knowledge of the architecture, hooks, query engine, caching mechanisms, type signatures, and real-world usage patterns.

---

## 1. Executive Summary & Mental Model

`@repo/react-appwrite` is a standalone, type-safe React SDK for Appwrite Web (v17+). It bridges Appwrite's imperative JavaScript Client SDK with idiomatic React paradigms (declarative hooks, automatic dependency tracking, optimistic mutations, unified querying, and realtime WebSocket synchronization).

### Core Architectural Pillars
1. **Cache Fusion Engine**:
   - In-memory reactive cache with optional persistence.
   - Implements *stale-while-revalidate* (`SWR`): components render instantly from cache while revalidating over the network in the background.
   - Automatic cache invalidation and targeted optimistic updates upon write operations (`create`, `update`, `delete`).
2. **Declarative Query Fusion**:
   - Replaces raw Appwrite query strings with a type-safe object syntax (`WhereFilter<T>`).
   - Supports operators (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$between`, `$search`, `$startsWith`, `$endsWith`) and nested logical branches (`$or`, `$and`).
3. **Resilient Realtime Sync**:
   - Wraps Appwrite WebSocket subscriptions with automatic reconnect, active channel deduplication, and direct cache mutation.

---

## 2. Package Setup & Provider Configuration

### 2.1 Installation & Monorepo Link
```bash
npm install @repo/react-appwrite appwrite
```
Inside the `lyder-eco` monorepo:
```json
{
  "dependencies": {
    "@repo/react-appwrite": "*",
    "appwrite": "^17.0.0"
  }
}
```

### 2.2 Root Initialization (`AppwriteProvider`)

Wrap your application root with `<AppwriteProvider>`. All hooks must reside within this context.

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { AppwriteProvider } from "@repo/react-appwrite";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppwriteProvider
      endpoint="https://fra.cloud.appwrite.io/v1"
      project="6a78d28e0032daf168f2"
      databaseId="6a796bcf000adcc94dc1"      // Default database for hooks
      storageKeyPrefix="layder"               // LocalStorage key namespace
      autoRestoreSession={true}               // Restores multi-account secrets
      onError={(err, context) => {
        console.error(`[Appwrite Error in ${context}]:`, err);
      }}
    >
      <App />
    </AppwriteProvider>
  </React.StrictMode>
);
```

#### `AppwriteProviderProps` API
| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `endpoint` | `string` | **Required** | Appwrite API endpoint (e.g. `https://cloud.appwrite.io/v1`). |
| `project` | `string` | **Required** | Appwrite Project ID. |
| `databaseId` | `string` | `undefined` | Default database ID passed down to database hooks. |
| `headers` | `Record<string, string>` | `{}` | Custom HTTP headers sent with client requests. |
| `storageKeyPrefix` | `string` | `"appwrite"` | Prefix for stored sessions and cache tokens. |
| `autoRestoreSession` | `boolean` | `true` | Restores previously persisted session secret on init. |
| `onError` | `(error, context) => void` | `undefined` | Global error handler for uncaught SDK exceptions. |

### 2.3 Core Context Hook: `useAppwrite()`

Access the initialized Appwrite service singletons and global configuration anywhere.

```tsx
import { useAppwrite } from "@repo/react-appwrite";

function MyComponent() {
  const {
    client,          // Appwrite Client instance
    account,         // Appwrite Account service
    databases,       // Appwrite Databases service
    storage,         // Appwrite Storage service
    functions,       // Appwrite Functions service
    messaging,       // Appwrite Messaging service
    teams,           // Appwrite Teams service
    avatars,         // Appwrite Avatars service
    locale,          // Appwrite Locale service
    cacheFusion,     // CacheFusionStore instance
    config,          // Global AppwriteConfig object
    isConnected,     // Live connection indicator
    activeSessionSecret,
    setSessionSecret // Function to set session token
  } = useAppwrite();

  return <div>Database ID: {config.databaseId}</div>;
}
```

---

## 3. Authentication & Account Management

### 3.1 `useUser<TUserDoc>()`
Fetches and subscribes to the authenticated user and their corresponding custom profile document from the database.

```tsx
import { useUser } from "@repo/react-appwrite";

interface UserProfile {
  displayName: string;
  theme?: "light" | "dark";
  notifications?: boolean;
}

export function ProfileHeader() {
  const { user, profile, isAuthenticated, isLoading, error, refresh, updatePrefs } = useUser<UserPreferences>();

  if (isLoading) return <div>Loading user...</div>;
  if (!isAuthenticated || !user) return <div>Please log in</div>;

  return (
    <div>
      <h2>Welcome, {user.name} ({user.email})</h2>
      <p>Theme: {profile?.theme || "dark"}</p>
      <button onClick={() => updatePrefs({ theme: "light" })}>Set Light Theme</button>
      <button onClick={() => refresh()}>Refresh</button>
    </div>
  );
}
```

#### Return Object: `UseUserReturn<TPreferences>`
- `user: Models.User<TPreferences> | null`: Appwrite auth account.
- `profile: TPreferences | null`: User preferences (`user.prefs`).
- `isAuthenticated: boolean`: `true` if valid session exists.
- `isLoading: boolean`: Initial fetch status.
- `error: Error | null`: Session or fetch error.
- `refresh: () => Promise<Models.User<TPreferences> | null>`: Forces reload of user.
- `updatePrefs: (prefs: TPreferences) => Promise<Models.User<TPreferences>>`: Updates user preferences on Appwrite Auth.

---

### 3.2 `useAuthActions()`
Provides high-level authentication actions.

```tsx
import { useAuthActions, OAuthProvider } from "@repo/react-appwrite";

export function AuthForm() {
  const {
    loginWithEmail,
    register,
    logout,
    loginWithOAuth,
    loginWithMagicURL,
    isPending,
    error
  } = useAuthActions();

  // 1. Password Login
  const handleLogin = async () => {
    await loginWithEmail("user@example.com", "SecretPassword123");
  };

  // 2. Account Registration
  const handleRegister = async () => {
    await register("alex@example.com", "Password123!", "Alex Johnson");
  };

  // 3. OAuth2 Sign In
  const handleGoogleLogin = () => {
    loginWithOAuth(OAuthProvider.Google, `${window.location.origin}/dashboard`);
  };

  return (
    <div>
      <button onClick={handleLogin}>Log In</button>
      <button onClick={handleRegister}>Sign Up</button>
      <button onClick={handleGoogleLogin}>Google Login</button>
      <button onClick={() => logout()}>Log Out</button>
    </div>
  );
}
```

---

### 3.3 `useMFA()`
Manage multi-factor authentication enrollment, TOTP authenticators, and challenges.

```tsx
import { useMFA } from "@repo/react-appwrite";

export function MFASettings() {
  const {
    status,           // { mfa: boolean }
    factors,          // { totp: boolean, phone: boolean, email: boolean }
    isLoading,
    enableMFA,
    disableMFA,
    createAuthenticator,
    verifyChallenge
  } = useMFA();

  const handleSetupTOTP = async () => {
    const totp = await createAuthenticator("totp");
    console.log("QR Code URI:", totp.uri);
    console.log("Secret:", totp.secret);
  };

  return (
    <div>
      <p>MFA Status: {status?.mfa ? "Enabled" : "Disabled"}</p>
      <button onClick={() => enableMFA()}>Enable MFA</button>
      <button onClick={handleSetupTOTP}>Set Up Authenticator App</button>
    </div>
  );
}
```

---

### 3.4 `useAccountSettings()`
Update profile name, email, password, phone, preferences, and view/revoke sessions.

```tsx
import { useAccountSettings } from "@repo/react-appwrite";

export function SecuritySettings() {
  const {
    updateName,
    updateEmail,
    updatePassword,
    getSessions,
    deleteSession,
    deleteOtherSessions
  } = useAccountSettings();

  const handlePasswordChange = async () => {
    await updatePassword({
      newPassword: "NewSuperSecret123!",
      oldPassword: "OldPassword123!"
    });
  };

  const handleRevokeAllOtherSessions = async () => {
    await deleteOtherSessions();
  };

  return <button onClick={handleRevokeAllOtherSessions}>Log Out All Other Devices</button>;
}
```

---

### 3.5 `useAccountSwitcher()`
Enables seamless multi-account switching in the client (e.g. switching between Admin, Instructor, and Student accounts without re-entering credentials).

```tsx
import { useAccountSwitcher } from "@repo/react-appwrite";

export function AccountPicker() {
  const { savedAccounts, switchAccount, removeAccount } = useAccountSwitcher();

  return (
    <ul>
      {savedAccounts.map((acc) => (
        <li key={acc.userId}>
          <span>{acc.name} ({acc.email})</span>
          <button onClick={() => switchAccount(acc.userId)}>Switch</button>
          <button onClick={() => removeAccount(acc.userId)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
```

---

## 4. Databases & Query Engine

All database hooks accept an optional `databaseId`. If omitted, the `databaseId` supplied to `AppwriteProvider` is used automatically.

### 4.1 Declarative Query Syntax (`WhereFilter<T>`)

Instead of writing `Query.equal("status", "active")`, write declarative JavaScript objects:

| Operator | Syntax Example | Appwrite Equivalent |
| :--- | :--- | :--- |
| Direct value | `{ status: "active" }` | `Query.equal("status", "active")` |
| `$eq` | `{ age: { $eq: 25 } }` | `Query.equal("age", 25)` |
| `$ne` | `{ status: { $ne: "archived" } }` | `Query.notEqual("status", "archived")` |
| `$gt` / `$gte` | `{ price: { $gte: 100 } }` | `Query.greaterThanEqual("price", 100)` |
| `$lt` / `$lte` | `{ stock: { $lt: 5 } }` | `Query.lessThan("stock", 5)` |
| `$in` | `{ role: { $in: ["admin", "editor"] } }` | `Query.contains("role", ["admin", "editor"])` |
| `$nin` | `{ category: { $nin: ["spam", "test"] } }` | `Query.notEqual(...)` for each |
| `$between` | `{ rating: { $between: [4, 5] } }` | `Query.between("rating", 4, 5)` |
| `$search` | `{ title: { $search: "react" } }` | `Query.search("title", "react")` |
| `$startsWith` | `{ code: { $startsWith: "INV-" } }` | `Query.startsWith("code", "INV-")` |
| `$endsWith` | `{ email: { $endsWith: "@company.com" } }`| `Query.endsWith("email", "@company.com")` |
| `$or` | `{ $or: [{ role: "admin" }, { level: 5 }] }` | `Query.or([...])` |
| `$and` | `{ $and: [{ active: true }, { score: 100 }] }` | `Query.and([...])` |

---

### 4.2 `useCollection<T>(collectionId, options)`
Fetches a list of documents with filtering, sorting, pagination, and optional realtime updates.

```tsx
import { useCollection } from "@repo/react-appwrite";

interface Product {
  $id: string;
  name: string;
  price: number;
  inStock: boolean;
}

export function ProductList() {
  const { data: products, isLoading, error, refetch } = useCollection<Product>("products", {
    where: {
      inStock: true,
      price: { $between: [20, 150] }
    },
    orderBy: { field: "price", direction: "asc" },
    limit: 20,
    realtime: true, // Auto-updates on database events
  });

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {products.map((p) => (
        <div key={p.$id}>{p.name} - ${p.price}</div>
      ))}
      <button onClick={() => refetch()}>Reload</button>
    </div>
  );
}
```

---

### 4.3 `useDocument<T>(collectionId, documentId, options)`
Fetches a single document by ID, subscribing to updates in realtime.

```tsx
import { useDocument } from "@repo/react-appwrite";

interface Course {
  $id: string;
  title: string;
  published: boolean;
}

export function CourseDetail({ courseId }: { courseId: string }) {
  const { document, isLoading, error, update, remove } = useDocument<Course>("courses", courseId, {
    realtime: true,
  });

  if (isLoading) return <div>Loading course...</div>;
  if (!document) return <div>Course not found</div>;

  return (
    <div>
      <h1>{document.title}</h1>
      <button onClick={() => update({ published: !document.published })}>
        Toggle Publish
      </button>
      <button onClick={() => remove()}>Delete Course</button>
    </div>
  );
}
```

---

### 4.4 `useMutations<T>(collectionId)`
Provides mutation actions with **optimistic UI updates** and automatic rollback if an error occurs.

```tsx
import { useMutations } from "@repo/react-appwrite";

interface Task {
  title: string;
  completed: boolean;
}

export function TaskManager() {
  const { createDocument, updateDocument, deleteDocument, isMutating } = useMutations<Task>("tasks");

  const handleAdd = async () => {
    // Instantly adds to CacheFusion and UI, syncs to backend in background
    const newTask = await createDocument(
      { title: "Review PR", completed: false },
      undefined, // permissions (optional)
      undefined, // documentId (optional; auto-generates ID.unique())
      { optimistic: true }
    );
    console.log("Created task:", newTask.$id);
  };

  const handleToggle = async (taskId: string, current: boolean) => {
    await updateDocument(taskId, { completed: !current }, undefined, { optimistic: true });
  };

  const handleDelete = async (taskId: string) => {
    await deleteDocument(taskId, { optimistic: true });
  };

  return (
    <div>
      <button disabled={isMutating} onClick={handleAdd}>Add Task</button>
    </div>
  );
}
```

---

### 4.5 `useCollectionWithPagination<T>(collectionId, options)`
Standard page-based navigation (`page`, `pageSize`, `totalPages`).

```tsx
import { useCollectionWithPagination } from "@repo/react-appwrite";

export function UsersTable() {
  const {
    data: users,
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    isLoading
  } = useCollectionWithPagination("Users", {
    pageSize: 10,
    where: { role: "Student" }
  });

  return (
    <div>
      <table>
        <tbody>
          {users.map(u => <tr key={u.$id}><td>{u.name}</td></tr>)}
        </tbody>
      </table>
      <div>
        <button disabled={!hasPrevPage} onClick={prevPage}>Prev</button>
        <span>Page {page} of {totalPages} ({total} total)</span>
        <button disabled={!hasNextPage} onClick={nextPage}>Next</button>
      </div>
    </div>
  );
}
```

---

### 4.6 `useInfiniteCollection<T>(collectionId, options)`
Cursor-based infinite scroll.

```tsx
import { useInfiniteCollection } from "@repo/react-appwrite";

export function Feed() {
  const { data, loadMore, hasMore, isLoadingMore, isLoading } = useInfiniteCollection("posts", {
    limit: 15,
    orderBy: { field: "$createdAt", direction: "desc" }
  });

  return (
    <div>
      {data.map(post => <article key={post.$id}>{post.content}</article>)}
      {hasMore && (
        <button disabled={isLoadingMore} onClick={loadMore}>
          {isLoadingMore ? "Loading..." : "Load More Posts"}
        </button>
      )}
    </div>
  );
}
```

---

### 4.7 `useBatchOperations<T>(collectionId)`
High-throughput bulk operations.

```tsx
import { useBatchOperations } from "@repo/react-appwrite";

export function BatchActions() {
  const { batchCreate, batchUpdate, batchDelete, isExecuting } = useBatchOperations("logs");

  const handleBulkInsert = async () => {
    await batchCreate([
      { data: { event: "login", level: "info" } },
      { data: { event: "checkout", level: "warn" } }
    ]);
  };

  const handleBulkDelete = async (ids: string[]) => {
    await batchDelete(ids);
  };

  return <button disabled={isExecuting} onClick={handleBulkInsert}>Bulk Insert</button>;
}
```

---

### 4.8 `useDocumentOperations<T>(collectionId, documentId)`
Targeted numeric increments, decrements, toggles, and patches on a specific document.

```tsx
import { useDocumentOperations } from "@repo/react-appwrite";

export function PostActions({ postId }: { postId: string }) {
  const { increment, decrement, toggle, patch } = useDocumentOperations("posts", postId);

  return (
    <div>
      <button onClick={() => increment("likesCount", 1)}>Like (+1)</button>
      <button onClick={() => decrement("likesCount", 1)}>Unlike (-1)</button>
      <button onClick={() => toggle("isPinned")}>Toggle Pin</button>
      <button onClick={() => patch({ status: "archived" })}>Archive</button>
    </div>
  );
}
```

---

### 4.9 `useSearchDocuments<T>(collectionId, searchField, options)`
Debounced full-text search hook.

```tsx
import { useSearchDocuments } from "@repo/react-appwrite";

export function SearchBar() {
  const { query, setQuery, results, isSearching } = useSearchDocuments("articles", "title", {
    debounceMs: 300,
    limit: 10
  });

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
      />
      {isSearching && <span>Searching...</span>}
      <ul>
        {results.map((item) => (
          <li key={item.$id}>{item.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

### 4.10 `useCollectionCount(collectionId, options)`
Retrieves total row count without loading document payloads.

```tsx
import { useCollectionCount } from "@repo/react-appwrite";

export function UnreadBadge() {
  const { count, isLoading } = useCollectionCount("notifications", {
    where: { read: false }
  });

  if (isLoading) return null;
  return <span className="badge">{count} unread</span>;
}
```

---

### 4.11 `useRelatedDocuments<TParent, TRelated>()`
Fetches a parent document and automatically resolves its relationship references.

```tsx
import { useRelatedDocuments } from "@repo/react-appwrite";

export function AuthorPosts({ authorId }: { authorId: string }) {
  const { parent, related, isLoading } = useRelatedDocuments(
    "authors",
    authorId,
    "postIds",       // Field on Author containing array of Post IDs
    "posts"          // Target collection
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Posts by {parent?.name}</h1>
      {related.map(post => <div key={post.$id}>{post.title}</div>)}
    </div>
  );
}
```

---

## 5. Storage & File Management

### 5.1 `useUpload(bucketId)`
Supports single and chunked multi-part uploads with a live progress percentage (0-100%).

```tsx
import { useUpload } from "@repo/react-appwrite";

export function FileUploader() {
  const { uploadFile, progress, isUploading, error } = useUpload("avatars");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploaded = await uploadFile(file, undefined, ["read(\"any\")"]);
    console.log("Uploaded file ID:", uploaded.$id);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={isUploading} />
      {isUploading && <progress value={progress} max={100} />}
      {error && <p style={{ color: "red" }}>{error.message}</p>}
    </div>
  );
}
```

---

### 5.2 `useFileUrl(bucketId, fileId, options)` & `AppwriteImage`
Generates preview and view URLs with transformations (dimensions, format, quality).

```tsx
import { useFileUrl, AppwriteImage } from "@repo/react-appwrite";

export function UserAvatar({ fileId }: { fileId: string }) {
  // Option A: Hook for raw URL
  const { previewUrl, viewUrl } = useFileUrl("avatars", fileId, {
    width: 200,
    height: 200,
    quality: 85,
    output: "webp"
  });

  // Option B: Optimized Image Component
  return (
    <div>
      <AppwriteImage
        bucketId="avatars"
        fileId={fileId}
        width={150}
        height={150}
        alt="User Avatar"
        fallbackSrc="/default-avatar.png"
      />
    </div>
  );
}
```

---

### 5.3 `useFiles(bucketId, options)` & `useFileDownload(bucketId)`
List bucket files and trigger browser downloads.

```tsx
import { useFiles, useFileDownload } from "@repo/react-appwrite";

export function FilesDirectory() {
  const { files, isLoading } = useFiles("documents", { limit: 50 });
  const { downloadFile } = useFileDownload("documents");

  if (isLoading) return <div>Loading files...</div>;

  return (
    <ul>
      {files.map((file) => (
        <li key={file.$id}>
          <span>{file.name} ({(file.sizeOriginal / 1024).toFixed(1)} KB)</span>
          <button onClick={() => downloadFile(file.$id, file.name)}>Download</button>
        </li>
      ))}
    </ul>
  );
}
```

---

## 6. Teams, Permissions & Route Guards

### 6.1 `useTeams()` & `useTeamMembers(teamId)`
Manage organizations, teams, and member invitations.

```tsx
import { useTeams, useTeamMembers } from "@repo/react-appwrite";

export function TeamManagement({ teamId }: { teamId: string }) {
  const { teams, createTeam } = useTeams();
  const { members, inviteMember, removeMember } = useTeamMembers(teamId);

  const handleInvite = async () => {
    await inviteMember({
      email: "colleague@example.com",
      roles: ["editor"],
      url: `${window.location.origin}/invite-accept`
    });
  };

  return (
    <div>
      <button onClick={handleInvite}>Invite Colleague</button>
      <ul>
        {members.map(m => (
          <li key={m.$id}>{m.name} ({m.roles.join(", ")})</li>
        ))}
      </ul>
    </div>
  );
}
```

---

### 6.2 `usePermissions()` & Guard Components
Declarative component-level authorization.

```tsx
import {
  usePermissions,
  TeamGuard,
  RoleGuard,
  PermissionGuard
} from "@repo/react-appwrite";

export function AdminPanel() {
  const { inTeam, hasRole } = usePermissions();

  const isBillingAdmin = inTeam("finance") && hasRole("admin", "finance");

  return (
    <div>
      {/* 1. Hook-based conditional */}
      {isBillingAdmin && <button>Download Invoices</button>}

      {/* 2. Declarative Team Guard */}
      <TeamGuard teamId="admins" fallback={<p>Access Denied: Admins Only</p>}>
        <div>Secret Admin Dashboard Content</div>
      </TeamGuard>

      {/* 3. Declarative Role Guard */}
      <RoleGuard teamId="instructors" roles={["lead", "head"]} fallback={<p>Not authorized</p>}>
        <div>Course Curriculum Approval UI</div>
      </RoleGuard>

      {/* 4. Declarative Permission Guard */}
      <PermissionGuard permission='read("team:admins")'>
        <div>Admin Audit Logs</div>
      </PermissionGuard>
    </div>
  );
}
```

---

## 7. Serverless Cloud Functions

### `useAppwriteFunction<TData>(functionId, defaultOptions)`
Execute background or synchronous cloud functions with full response and error tracing.

```tsx
import { useAppwriteFunction } from "@repo/react-appwrite";

interface ManageAdminResponse {
  success: boolean;
  adminId: string;
}

export function CreateAdminButton() {
  const { execute, isLoading, data, error } = useAppwriteFunction<ManageAdminResponse>("manageAdmin");

  const handleCreate = async () => {
    const result = await execute({
      action: "createAdmin",
      email: "newadmin@example.com",
      role: "SuperVisor"
    }, {
      async: false, // Synchronous execution (waits for return)
      method: "POST"
    });

    console.log("Function returned:", result.adminId);
  };

  return (
    <div>
      <button disabled={isLoading} onClick={handleCreate}>
        {isLoading ? "Executing..." : "Create Admin via Cloud Function"}
      </button>
      {data && <p>Admin Created: {data.adminId}</p>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}
    </div>
  );
}
```

---

## 8. Messaging & Web Push

### `useMessaging()`
Browser notification permissions, target registrations, and topic subscriptions.

```tsx
import { useMessaging } from "@repo/react-appwrite";

export function NotificationsToggle() {
  const {
    isSupported,
    permissionStatus,
    requestPermission,
    registerPushTarget,
    subscribeToTopic
  } = useMessaging();

  const handleEnablePush = async () => {
    const perm = await requestPermission();
    if (perm === "granted") {
      // Register APNS / FCM / Web Push target
      const target = await registerPushTarget("my-push-provider");
      await subscribeToTopic("announcements", "subscriber_1", target.$id);
    }
  };

  if (!isSupported) return <p>Push notifications not supported.</p>;

  return (
    <div>
      <p>Permission: {permissionStatus}</p>
      <button onClick={handleEnablePush}>Enable Push Notifications</button>
    </div>
  );
}
```

---

## 9. Utilities & Raw Realtime Subscriptions

### 9.1 `useAvatars()`
Generate avatars, initials graphics, credit card icons, favicons, and country flags.

```tsx
import { useAvatars } from "@repo/react-appwrite";

export function UserBadges() {
  const { getInitials, getQR, getFlag } = useAvatars();

  return (
    <div>
      <img src={getInitials("Mohamed Hassan", 64, 64).toString()} alt="MH" />
      <img src={getFlag("EG", 32, 24).toString()} alt="Egypt" />
      <img src={getQR("https://lyder.app", 150).toString()} alt="QR" />
    </div>
  );
}
```

---

### 9.2 `useLocale()`
Access visitor country, currencies, languages, and continents.

```tsx
import { useLocale } from "@repo/react-appwrite";

export function UserLocation() {
  const { locale, countries, isLoading } = useLocale();

  if (isLoading) return <span>Detecting location...</span>;

  return <div>Country: {locale?.country} ({locale?.countryCode})</div>;
}
```

---

### 9.3 `usePresence(channel, userInfo)`
Presence tracking over Appwrite WebSocket channels.

```tsx
import { usePresence } from "@repo/react-appwrite";

export function OnlinePresenceRoom({ roomId, currentUserName }: { roomId: string; currentUserName: string }) {
  const { activeUsers } = usePresence(`room_${roomId}`, {
    name: currentUserName,
    joinedAt: Date.now()
  });

  return (
    <div>
      <h3>Online Now ({activeUsers.length})</h3>
      <ul>
        {activeUsers.map(u => <li key={u.userId}>{u.name}</li>)}
      </ul>
    </div>
  );
}
```

---

### 9.4 `useRealtimeSubscription(channels, callback)`
Low-level WebSocket subscription for custom channels or events.

```tsx
import { useRealtimeSubscription } from "@repo/react-appwrite";

export function LiveAuditFeed() {
  useRealtimeSubscription(["databases.*.collections.audit_logs.documents"], (response) => {
    console.log("Audit event:", response.events);
    console.log("Payload:", response.payload);
  });

  return <div>Listening to real-time audit events...</div>;
}
```

---

## 10. Direct Appwrite SDK Re-exports

For maximum flexibility, the package re-exports primary Appwrite SDK utilities:

```tsx
import {
  ID,                   // ID.unique(), ID.custom(...)
  Query,                // Raw query builders: Query.equal(...)
  Permission,           // Permission.read(...), Permission.write(...)
  Role,                 // Role.any(), Role.user(...), Role.team(...)
  OAuthProvider,        // OAuthProvider.Google, OAuthProvider.Github
  ExecutionMethod,      // ExecutionMethod.POST, ExecutionMethod.GET
  AppwriteException,    // Exception type
  type Models           // Models.User, Models.Document, Models.File, etc.
} from "@repo/react-appwrite";
```

---

## 11. AI Agent Decision Matrix & Best Practices

| Task / Requirement | Recommended Hook / Pattern | Avoid / Anti-pattern |
| :--- | :--- | :--- |
| Read collection data | `useCollection("col", { where: { ... } })` | Manual `useEffect` + `databases.listDocuments` |
| Form submit / Single record edit | `useMutations("col")` with `{ optimistic: true }` | Mutating remote without optimistic UI |
| Large data grid / Table | `useCollectionWithPagination("col", { pageSize: 25 })` | Fetching entire collection into memory |
| Social feed / Infinite scroll | `useInfiniteCollection("col", { limit: 10 })` | Tracking offset state manually in component |
| Search bar with live suggestions | `useSearchDocuments("col", "title", { debounceMs: 250 })` | Querying on every keystroke without debounce |
| Authenticated routing | `<TeamGuard teamId="..." fallback={...}>` or `usePermissions` | Ad-hoc token checks in `useEffect` |
| Signup / User registration | `register(email, password, name)` | Creating ad-hoc user documents without valid session |
| Large file uploads | `useUpload("bucket")` using built-in `progress` | Reading entire files into base64 strings |

### Key Agent Rules
1. **Never use raw document state when `useMutations` is available**: Always prefer `useMutations` for updates to ensure cache synchronization across all listening components.
2. **Stable Hook Dependencies**: When passing `where` or `orderBy` options, literals are auto-serialized by query string hashing, but passing callback functions should be wrapped in `useCallback` or `useRef`.
3. **Database ID resolution**: Do not hardcode database IDs across hooks if `AppwriteProvider` has a default `databaseId` configured.
