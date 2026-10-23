# `@repo/react-appwrite`

A comprehensive, production-ready, and fully type-safe React library for **Appwrite Web SDK**, specifically engineered for React Single Page Applications (Vite / CRA / Next.js SPA mode).

---

## ✨ Features

- 🔄 **Cache Fusion Engine**: Zero-re-fetch WebSocket synchronization that merges `.create`, `.update`, `.delete` events directly into local state in-memory.
- ⚡ **Unified Collection Hooks**: Search, declarative filtering (`$gte`, `$in`, `$search`), sorting, and pagination in a single hook with automatic search debounce and page reset.
- 🔐 **Multi-Session Account Switcher**: Facebook-style multi-identity swapper via browser `localStorage` and `client.setSession()`.
- 🛡️ **Strict React Hook Dependency Hygiene**: Zero stale closures, strict `useRef` unmount guards, stable `useCallback` references, and leak-free cleanups.
- 📦 **Complete Appwrite SDK Coverage**:
  - `Account` (Auth, OAuth, OTP, Magic URL, Phone SMS, Anonymous, MFA, Sessions)
  - `Databases` (Unified queries, Infinite scroll, Single documents, Relations, Optimistic mutations)
  - `Storage` (Chunked multi-file upload with progress/pause/resume/abort, `AppwriteImage`, downloads)
  - `Teams` (Memberships, Roles, Permissions, Guard Components: `<RequireAuth>`, `<HasRole>`, `<HasTeam>`)
  - `Functions` (Serverless function execution, response parsing, durations, status codes)
  - `Messaging` (Web Push notification permissions, target registrations)
  - `Realtime & Presences` (Online/offline user status broadcasting)
  - `Avatars & Locale` (Initials, QR codes, Credit cards, Flags, Country/Currency lookups)
- 🛠️ **CLI Schema Generator (`appwrite-react-gen`)**: Connects to your Appwrite database and generates TypeScript interfaces for compile-time safety and field autocomplete.

---

## 🚀 Installation & Quick Start

### 1. Wrap your Application in `<AppwriteProvider>`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { AppwriteProvider } from "@repo/react-appwrite";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppwriteProvider
      endpoint="https://cloud.appwrite.io/v1"
      project="YOUR_PROJECT_ID"
      onError={(err, context) => console.error(`[Appwrite Error in ${context}]`, err)}
    >
      <App />
    </AppwriteProvider>
  </React.StrictMode>
);
```

---

## 📖 Usage Examples

### 1. Authentication & Account Management

```tsx
import React, { useState } from "react";
import { AuthProvider, useAuth } from "@repo/react-appwrite";

export function AuthBar() {
  const { user, register, loginWithEmail, logout, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading user...</div>;

  if (isAuthenticated) {
    return (
      <div>
        <span>Welcome, {user?.name}! ({user?.email})</span>
        <button onClick={() => logout()}>Logout</button>
      </div>
    );
  }

  const handleSignUp = async () => {
    await register("test@example.com", "password123", "Test User");
  };

  return (
    <div>
      <button onClick={() => loginWithEmail("test@example.com", "password")}>Login</button>
      <button onClick={handleSignUp}>Sign Up</button>
    </div>
  );
}
```

---

### 2. Unified Database Queries with Realtime Sync & Advanced Querying

All database hooks support **optional `databaseId`** when configured in `<AppwriteProvider config={{ databaseId: "my_db" }}>`:
- `useCollection("posts_coll", options)` OR `useCollection("my_db", "posts_coll", options)`

```tsx
import React from "react";
import { useCollection, useMutations, Query } from "@repo/react-appwrite";

interface Post {
  title: string;
  price: number;
  status: "active" | "draft" | "archived";
  isPinned: boolean;
}

export function PostsList() {
  const {
    documents: posts,
    loading,
    total,
    page,
    totalPages,
    nextPage,
    prevPage,
    search,
    setSearch,
    setFilter,
  } = useCollection<Post>("posts_coll", {
    where: {
      // Logical $or and $and operators
      $or: [
        { status: "active" },
        { status: "draft" },
      ],
      price: { $gte: 50, $lte: 500 },
    },
    // Multi-column sorting
    sort: [
      { field: "isPinned", order: "desc" },
      { field: "$createdAt", order: "desc" },
    ],
    // Raw Appwrite queries passthrough
    queries: [Query.select(["title", "price", "status"])],
    limit: 10,
    realtime: true, // Cache Fusion zero-re-fetch WebSocket sync!
  });

  const { createDocument, updateDocument, deleteDocument } = useMutations<Post>("posts_coll");

  return (
    <div>
      <input
        placeholder="Search posts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)} // Auto-debounced!
      />

      <button onClick={() => setFilter({ status: "draft" })}>Show Drafts</button>

      {loading ? <p>Loading...</p> : (
        <ul>
          {posts.map((post) => (
            <li key={post.$id}>
              {post.title} - ${post.price}
              <button onClick={() => deleteDocument(post.$id, true)}>Soft Delete</button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <button onClick={prevPage} disabled={page <= 1}>Previous</button>
        <span> Page {page} of {totalPages} (Total: {total}) </span>
        <button onClick={nextPage} disabled={page >= totalPages}>Next</button>
      </div>
    </div>
  );
}
```

---

### 3. Advanced Cursor Pagination (`useCollectionWithPagination`)

Appwrite restricts `Query.offset()` to 5,000 documents. `useCollectionWithPagination` uses an automated cursor stack to scale past 5,000 documents seamlessly:

```tsx
import { useCollectionWithPagination } from "@repo/react-appwrite";

export function PaginatedProducts() {
  const {
    data: products,
    loading,
    page,
    pageSize,
    totalPages,
    totalCount,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    setPageSize,
  } = useCollectionWithPagination<Product>("products", {
    pageSize: 25,
    paginationMode: "cursor", // "cursor" for large datasets >5,000, "offset", or "auto"
    where: { inStock: true },
  });

  return (
    <div>
      <h3>Products (Total: {totalCount})</h3>
      {loading ? <p>Loading...</p> : (
        <ul>
          {products.map(p => <li key={p.$id}>{p.name} - ${p.price}</li>)}
        </ul>
      )}
      <button onClick={prevPage} disabled={!hasPrevPage}>Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button onClick={nextPage} disabled={!hasNextPage}>Next</button>
    </div>
  );
}
```

---

### 4. Bulk & Batch Operations (`useBatchOperations`)

Chunked, concurrent batch modifications with progress tracking and rate-limit safety:

```tsx
import { useBatchOperations } from "@repo/react-appwrite";

export function BatchActions() {
  const { bulkCreate, bulkUpdate, bulkDelete, isLoading, progress } = useBatchOperations("tasks");

  const handleDeleteMany = async (ids: string[]) => {
    const result = await bulkDelete(ids, {
      chunkSize: 5, // 5 requests at a time to prevent HTTP 429 rate limits
      onProgress: ({ percent, completed, total }) => {
        console.log(`Deleted ${completed}/${total} (${percent}%)`);
      },
    });
    console.log(`Successfully deleted ${result.succeededIds.length} items`);
  };

  return (
    <div>
      {isLoading && <p>Processing batch: {progress.percent}%</p>}
      <button onClick={() => handleDeleteMany(["id1", "id2", "id3"])}>Delete Selected</button>
    </div>
  );
}
```

---

### 5. Document Operations (`useDocumentOperations`)

Perform atomic field increments, array operations, upserts, and soft deletes:

```tsx
import { useDocumentOperations } from "@repo/react-appwrite";

export function ArticleActions({ articleId }: { articleId: string }) {
  const {
    upsertDocument,
    incrementField,
    arrayUnion,
    softDelete,
    restore,
  } = useDocumentOperations<Article>("articles");

  return (
    <div>
      {/* Upsert: Update if exists, or create if 404 */}
      <button onClick={() => upsertDocument(articleId, { title: "Updated Title" })}>
        Upsert Article
      </button>

      {/* Atomic field increment */}
      <button onClick={() => incrementField(articleId, "viewCount", 1)}>
        +1 View
      </button>

      {/* Array union (deduplicated append) */}
      <button onClick={() => arrayUnion(articleId, "tags", "react")}>
        Add Tag
      </button>

      {/* Soft delete / restore */}
      <button onClick={() => softDelete(articleId)}>Soft Delete</button>
      <button onClick={() => restore(articleId)}>Restore</button>
    </div>
  );
}
```

---

### 6. Lightweight Aggregates & Badge Counts (`useCollectionCount`)

Query counts with near-zero network payload (`Query.limit(1)` and `Query.select(["$id"])`) and live realtime count updates:

```tsx
import { useCollectionCount } from "@repo/react-appwrite";

export function NotificationBadge({ userId }: { userId: string }) {
  const { count, loading } = useCollectionCount("notifications", {
    where: { userId, isRead: false },
    realtime: true, // auto-increments on .create, decrements on .delete
  });

  if (loading) return <span>...</span>;
  return <span className="badge">{count} unread</span>;
}
```

---

### 7. Dedicated Collection Search (`useSearchDocuments`)

Multi-attribute search with automatic debouncing and recent search history:

```tsx
import { useSearchDocuments } from "@repo/react-appwrite";

export function SearchBar() {
  const {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    recentSearches,
    clearRecentSearches,
    clearSearch,
  } = useSearchDocuments<Article>("articles", {
    searchFields: ["title", "content"],
    debounceMs: 300,
    minChars: 2,
    storeRecent: true,
  });

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search articles..."
      />
      {loading && <span>Searching...</span>}

      <ul>
        {results.map(doc => <li key={doc.$id}>{doc.title}</li>)}
      </ul>
    </div>
  );
}
```

---

### 8. Responsive Images & Storage Uploads

```tsx
import React from "react";
import { AppwriteImage, useUpload } from "@repo/react-appwrite";

export function ProfileAvatar({ fileId }: { fileId: string }) {
  const { uploadFile, progress, isUploading } = useUpload({
    bucketId: "avatars_bucket",
  });

  return (
    <div>
      <AppwriteImage
        bucketId="avatars_bucket"
        fileId={fileId}
        transformations={{
          width: 200,
          height: 200,
          quality: 90,
          borderRadius: 100,
          output: "webp",
        }}
        fallbackSrc="/default-avatar.png"
      />

      <input
        type="file"
        onChange={async (e) => {
          if (e.target.files?.[0]) {
            await uploadFile(e.target.files[0]);
          }
        }}
      />

      {isUploading && <div>Uploading: {progress[fileId]?.percentage}%</div>}
    </div>
  );
}
```

---

### 9. RBAC & Guard Components

```tsx
import React from "react";
import { RequireAuth, HasRole, HasTeam } from "@repo/react-appwrite";

export function AdminPanel() {
  return (
    <RequireAuth fallback={<div>Please log in to view this page.</div>}>
      <HasTeam teamId="finance_team" fallback={<div>Finance team access only.</div>}>
        <HasRole role="admin" fallback={<div>Admin permissions required.</div>}>
          <h1>Protected Financial Dashboard</h1>
        </HasRole>
      </HasTeam>
    </RequireAuth>
  );
}
```

---

## 🛠️ TypeScript Schema Generator CLI

To generate type definitions directly from your Appwrite database schema:

```bash
npx appwrite-react-gen --endpoint=https://cloud.appwrite.io/v1 --project=MY_PROJECT --key=SERVER_API_KEY --db=MY_DB --out=src/types/appwrite.d.ts
```

This generates typed interfaces matching all your Appwrite attributes, enums, numbers, dates, and relationships.
