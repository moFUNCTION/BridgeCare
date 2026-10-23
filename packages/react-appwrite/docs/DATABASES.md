# Databases & Realtime Query Module

The Databases module provides declarative query building, auto-debounced search, unified pagination, optimistic mutations, relationship querying, and zero-re-fetch realtime sync.

---

## 1. Declarative Query Builder (`queryBuilder`)

Instead of writing verbose `Query.equal("status", ["active"])` calls manually, you can express filters as standard JavaScript objects:

```ts
{
  where: {
    status: "active",                              // Query.equal("status", "active")
    price: { $gte: 100, $lte: 500 },               // Query.greaterThanEqual & Query.lessThanEqual
    category: { $in: ["electronics", "audio"] },   // Query.equal("category", ["electronics", "audio"])
    tags: { $contains: "featured" },               // Query.contains("tags", "featured")
    authorId: { $isNotNull: true },                // Query.isNotNull("authorId")
    bio: { $search: "developer" },                 // Query.search("bio", "developer")
    score: { $between: [80, 100] }                 // Query.between("score", 80, 100)
  }
}
```

### Supported Operators

| Operator | Appwrite Translation | Example |
|---|---|---|
| `$eq` / direct value | `Query.equal(key, val)` | `{ status: "active" }` |
| `$ne` | `Query.notEqual(key, val)` | `{ status: { $ne: "banned" } }` |
| `$gt` | `Query.greaterThan(key, val)` | `{ age: { $gt: 18 } }` |
| `$gte` | `Query.greaterThanEqual(key, val)` | `{ price: { $gte: 50 } }` |
| `$lt` | `Query.lessThan(key, val)` | `{ stock: { $lt: 5 } }` |
| `$lte` | `Query.lessThanEqual(key, val)` | `{ discount: { $lte: 50 } }` |
| `$between` | `Query.between(key, min, max)` | `{ rating: { $between: [4, 5] } }` |
| `$search` | `Query.search(key, query)` | `{ title: { $search: "phone" } }` |
| `$startsWith` | `Query.startsWith(key, prefix)`| `{ sku: { $startsWith: "TECH-" } }` |
| `$endsWith` | `Query.endsWith(key, suffix)` | `{ email: { $endsWith: "@gmail.com" } }` |
| `$contains` | `Query.contains(key, val)` | `{ tags: { $contains: "react" } }` |
| `$isNull` / `$isNotNull` | `Query.isNull` / `Query.isNotNull` | `{ deletedAt: { $isNull: true } }` |
| `$in` / `$nin` | `Query.equal` / `Query.notEqual` | `{ role: { $in: ["admin", "editor"] } }` |

---

## 2. `useCollection<T>(databaseId, collectionId, options)`

Unified collection hook that combines search, filtering, sorting, pagination, and realtime updates in a single hook.

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `where` | `WhereFilter<T>` | `{}` | Declarative filter object. |
| `search` | `string` | `""` | Search text query. |
| `searchField` | `string` | `"$id"` | Target column for search query. |
| `searchDebounceMs` | `number` | `300` | Automatic debounce delay before query execution. |
| `select` | `string[]` | `undefined` | Array of attributes to return (projection). |
| `limit` | `number` | `25` | Documents per page. |
| `page` | `number` | `1` | Initial page number. |
| `sortField` | `string` | `undefined` | Attribute name to order by. |
| `sortOrder` | `"asc" \| "desc"` | `"asc"` | Sort direction. |
| `realtime` | `boolean` | `true` | Enables zero-re-fetch Cache Fusion WebSocket sync. |
| `enabled` | `boolean` | `true` | When `false`, suppresses network execution. |

### Returns

```ts
interface UseCollectionReturn<T> {
  documents: (T & Models.Document)[];
  total: number;
  loading: boolean;
  error: Error | null;
  page: number;
  totalPages: number;
  limit: number;
  search: string;
  setSearch: (search: string) => void;
  setFilter: (where: WhereFilter<T> | ((prev: WhereFilter<T>) => WhereFilter<T>)) => void;
  setSort: (field: keyof T | string, order?: "asc" | "desc") => void;
  setPage: (page: number | ((prev: number) => number)) => void;
  nextPage: () => void;
  prevPage: () => void;
  refetch: () => Promise<void>;
}
```

### Auto-Reset & Debounce Behaviors:
- **Auto-Debounce**: Calling `setSearch("term")` updates the UI input immediately and delays the network query by `searchDebounceMs` (300ms).
- **Auto-Reset**: Changing `search` or `filter` automatically resets `page` back to `1`.

---

## 3. `useInfiniteCollection<T>(databaseId, collectionId, options)`

Cursor-based infinite scroll data hook utilizing `Query.cursorAfter`.

### Example

```tsx
import React from "react";
import { useInfiniteCollection } from "@repo/react-appwrite";

export function Feed() {
  const { documents, loading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteCollection("main_db", "posts", {
      pageSize: 15,
      sortField: "$createdAt",
      sortOrder: "desc",
    });

  return (
    <div>
      {documents.map((doc) => (
        <article key={doc.$id}>{doc.title}</article>
      ))}

      {hasNextPage && (
        <button onClick={fetchNextPage} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading more..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

---

## 4. `useDocument<T>(databaseId, collectionId, documentId, options)`

Fetches a single document and maintains real-time sync with local Cache Fusion.

```tsx
import { useDocument } from "@repo/react-appwrite";

const { document, loading, error, refetch } = useDocument<Product>(
  "main_db",
  "products",
  "prod_123",
  { select: ["name", "price", "inventory"] }
);
```

---

## 5. `useRelatedDocuments<T>(databaseId, targetCollectionId, parentId, relationshipAttribute)`

Directly queries child collections to bypass Appwrite's unpaginated nested array limitation.

```tsx
import { useRelatedDocuments } from "@repo/react-appwrite";

// Queries all comments belonging to a specific post: Query.equal("postId", "post_123")
const { documents: comments, total, page, nextPage } = useRelatedDocuments<Comment>(
  "main_db",
  "comments",
  "post_123",
  "postId"
);
```

---

## 6. `useMutations<T>(databaseId, collectionId)`

Mutation hook equipped with **Optimistic UI Updates**, automatic rollback on failure, and **Soft Delete** support.

### Methods

| Method | Description |
|---|---|
| `createDocument(data, documentId?, permissions?)` | Optimistically inserts document in local cache and commits to Appwrite server. |
| `updateDocument(documentId, data, permissions?)` | Optimistically mutates document in local state; rolls back if server returns error. |
| `deleteDocument(documentId, softDelete?: boolean)` | Deletes document; if `softDelete = true`, marks `isDeleted: true` instead. |

### Example

```tsx
import { useMutations } from "@repo/react-appwrite";

const { createDocument, updateDocument, deleteDocument, isLoading } = useMutations<Task>(
  "main_db",
  "tasks"
);

// Optimistic create
await createDocument({ title: "New Task", completed: false });

// Soft delete
await deleteDocument("task_123", true);
```
