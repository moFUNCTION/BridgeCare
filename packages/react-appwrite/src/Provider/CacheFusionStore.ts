import type { Models } from "appwrite";
import type { ICacheFusionStore, RealtimeEventPayload } from "../types";

export class CacheFusionStore implements ICacheFusionStore {
  // Document Cache: "dbId:collId:docId" -> Document
  private documents = new Map<string, Models.Document>();

  // Collection Queries Cache: "dbId:collId:queryHash" -> { documents, total }
  private collectionQueries = new Map<string, { documents: Models.Document[]; total: number }>();

  // Listeners for query keys or document keys
  private listeners = new Map<string, Set<() => void>>();

  private getDocKey(databaseId: string, collectionId: string, documentId: string): string {
    return `doc:${databaseId}:${collectionId}:${documentId}`;
  }

  private getCollPrefix(databaseId: string, collectionId: string): string {
    return `coll:${databaseId}:${collectionId}:`;
  }

  getDocument<T = any>(
    databaseId: string,
    collectionId: string,
    documentId: string
  ): (T & Models.Document) | undefined {
    const key = this.getDocKey(databaseId, collectionId, documentId);
    return this.documents.get(key) as (T & Models.Document) | undefined;
  }

  setDocument<T = any>(
    databaseId: string,
    collectionId: string,
    document: T & Models.Document
  ): void {
    if (!document || !document.$id) return;
    const key = this.getDocKey(databaseId, collectionId, document.$id);
    this.documents.set(key, document);

    // Also update this document inside any matching collection queries
    const collPrefix = this.getCollPrefix(databaseId, collectionId);
    for (const [qKey, data] of this.collectionQueries.entries()) {
      if (qKey.startsWith(collPrefix)) {
        const index = data.documents.findIndex((d) => d.$id === document.$id);
        if (index !== -1) {
          const updated = [...data.documents];
          updated[index] = document;
          this.collectionQueries.set(qKey, { ...data, documents: updated });
          this.notify(qKey);
        }
      }
    }

    this.notify(key);
  }

  removeDocument(databaseId: string, collectionId: string, documentId: string): void {
    const key = this.getDocKey(databaseId, collectionId, documentId);
    this.documents.delete(key);

    // Remove document from all cached collection queries
    const collPrefix = this.getCollPrefix(databaseId, collectionId);
    for (const [qKey, data] of this.collectionQueries.entries()) {
      if (qKey.startsWith(collPrefix)) {
        const filtered = data.documents.filter((d) => d.$id !== documentId);
        if (filtered.length !== data.documents.length) {
          this.collectionQueries.set(qKey, {
            documents: filtered,
            total: Math.max(0, data.total - 1),
          });
          this.notify(qKey);
        }
      }
    }

    this.notify(key);
  }

  getCollectionQuery<T = any>(
    queryKey: string
  ): { documents: (T & Models.Document)[]; total: number } | undefined {
    const data = this.collectionQueries.get(queryKey);
    if (!data) return undefined;
    return data as { documents: (T & Models.Document)[]; total: number };
  }

  setCollectionQuery<T = any>(
    queryKey: string,
    data: { documents: (T & Models.Document)[]; total: number }
  ): void {
    this.collectionQueries.set(queryKey, data);
    // Also warm the document cache
    for (const doc of data.documents) {
      if (doc.$databaseId && doc.$collectionId && doc.$id) {
        const docKey = this.getDocKey(doc.$databaseId, doc.$collectionId, doc.$id);
        this.documents.set(docKey, doc);
      }
    }
    this.notify(queryKey);
  }

  handleRealtimeEvent<T = any>(event: RealtimeEventPayload<T>): void {
    if (!event || !event.payload || !event.payload.$id) return;
    const doc = event.payload;
    const databaseId = doc.$databaseId;
    const collectionId = doc.$collectionId;
    if (!databaseId || !collectionId) return;

    const isCreate = event.events.some((e) => e.endsWith(".create"));
    const isUpdate = event.events.some((e) => e.endsWith(".update"));
    const isDelete = event.events.some((e) => e.endsWith(".delete"));

    if (isDelete) {
      this.removeDocument(databaseId, collectionId, doc.$id);
      return;
    }

    if (isUpdate) {
      this.setDocument(databaseId, collectionId, doc);
      return;
    }

    if (isCreate) {
      // Add to document cache
      const docKey = this.getDocKey(databaseId, collectionId, doc.$id);
      this.documents.set(docKey, doc);

      // Prepend to matching collection queries (zero re-fetch sync)
      const collPrefix = this.getCollPrefix(databaseId, collectionId);
      for (const [qKey, data] of this.collectionQueries.entries()) {
        if (qKey.startsWith(collPrefix)) {
          const exists = data.documents.some((d) => d.$id === doc.$id);
          if (!exists) {
            this.collectionQueries.set(qKey, {
              documents: [doc, ...data.documents],
              total: data.total + 1,
            });
            this.notify(qKey);
          }
        }
      }
      this.notify(docKey);
    }
  }

  subscribeToKey(key: string, listener: () => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const set = this.listeners.get(key)!;
    set.add(listener);

    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  private notify(key: string): void {
    const set = this.listeners.get(key);
    if (set) {
      set.forEach((listener) => {
        try {
          listener();
        } catch (e) {
          console.error(`[CacheFusionStore] Listener error for key ${key}:`, e);
        }
      });
    }
  }

  clear(): void {
    this.documents.clear();
    this.collectionQueries.clear();
    this.listeners.clear();
  }
}
