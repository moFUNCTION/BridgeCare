# Core Provider & Service Context

The Provider module establishes the global context for `@repo/react-appwrite`, initializing the Appwrite `Client` and all core services (`Account`, `Databases`, `Storage`, `Functions`, `Messaging`, `Teams`, `Avatars`, `Locale`).

---

## `<AppwriteProvider>`

Wrap your application root with `<AppwriteProvider>`.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `endpoint` | `string` | **Required** | Appwrite API endpoint (e.g. `https://cloud.appwrite.io/v1` or local instance). |
| `project` | `string` | **Required** | Appwrite Project ID. |
| `headers` | `Record<string, string>` | `undefined` | Optional custom HTTP headers sent with every request. |
| `onError` | `(error: unknown, context: string) => void` | `undefined` | Centralized callback for catching network/API errors (401, 403, 429 rate limits, etc.). |
| `storageKeyPrefix` | `string` | `"appwrite"` | Prefix for local storage keys (active session, saved accounts). |
| `autoRestoreSession` | `boolean` | `true` | Automatically restores saved session secret from browser `localStorage` on load. |

### Example

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { AppwriteProvider } from "@repo/react-appwrite";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppwriteProvider
      endpoint="https://cloud.appwrite.io/v1"
      project="65dfa87b0012c8a"
      onError={(err, context) => {
        console.error(`[Appwrite Global Error in ${context}]:`, err);
      }}
      storageKeyPrefix="my_app"
    >
      <App />
    </AppwriteProvider>
  </React.StrictMode>
);
```

---

## `useAppwrite()`

Hook providing direct access to initialized SDK services, connection status, and active session management.

### Returns

```ts
interface AppwriteContextValue {
  client: Client;
  account: Account;
  databases: Databases;
  storage: Storage;
  functions: Functions;
  messaging: Messaging;
  teams: Teams;
  avatars: Avatars;
  locale: Locale;
  cacheFusion: ICacheFusionStore;
  config: AppwriteConfig;
  isConnected: boolean;
  activeSessionSecret: string | null;
  setSessionSecret: (secret: string | null) => void;
}
```

### Example

```tsx
import React from "react";
import { useAppwrite } from "@repo/react-appwrite";

export function ConnectionIndicator() {
  const { isConnected, client } = useAppwrite();

  return (
    <div style={{ color: isConnected ? "green" : "red" }}>
      Status: {isConnected ? "Online" : "Offline"}
    </div>
  );
}
```

---

## ⚡ Cache Fusion Engine (`CacheFusionStore`)

`CacheFusionStore` is the high-performance, in-memory cache that powers `@repo/react-appwrite`.

### How It Works:
1. **Document Caching**: When any query or document is fetched, it is stored in `CacheFusionStore` by `databaseId:collectionId:documentId`.
2. **WebSocket Fusion**: Realtime WebSocket subscriptions listen to `databases.[id].collections.[id].documents`.
3. **Zero Re-Fetch Updates**:
   - **`create`**: Inserts the new document directly into active query caches without triggering an HTTP GET request.
   - **`update`**: Updates the document in-place across all collection queries and single-document hooks simultaneously.
   - **`delete`**: Removes the document from local query arrays and adjusts `total` count.
