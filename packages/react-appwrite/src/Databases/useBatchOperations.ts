import { useState, useCallback, useMemo } from "react";
import { ID, type Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import { resolveDbAndCollection } from "./helpers";
import type {
  BatchOperationOptions,
  BatchProgress,
  BatchResult,
  UseBatchOperationsReturn,
} from "../types";

// Utility to slice array into chunks
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function useBatchOperations<T = Record<string, any>>(
  collectionId: string
): UseBatchOperationsReturn<T>;
export function useBatchOperations<T = Record<string, any>>(
  databaseId: string,
  collectionId: string
): UseBatchOperationsReturn<T>;
export function useBatchOperations<T = Record<string, any>>(
  arg1: string,
  arg2?: string
): UseBatchOperationsReturn<T> {
  const { databases, cacheFusion, config } = useAppwrite();
  const { databaseId, collectionId } = resolveDbAndCollection(config.databaseId, arg1, arg2);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<BatchProgress>({
    completed: 0,
    total: 0,
    percent: 0,
  });

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setProgress({ completed: 0, total: 0, percent: 0 });
  }, []);

  const bulkCreate = useCallback(
    async (
      documents: Partial<T>[],
      options?: BatchOperationOptions & { permissions?: string[] }
    ): Promise<BatchResult<T>> => {
      if (!documents || documents.length === 0) {
        return { succeeded: [], succeededIds: [], failed: [], totalProcessed: 0 };
      }

      setIsLoading(true);
      setError(null);

      const chunkSize = options?.chunkSize || 5;
      const continueOnError = options?.continueOnError !== false;
      const total = documents.length;
      let completed = 0;

      const succeeded: (T & Models.Document)[] = [];
      const succeededIds: string[] = [];
      const failed: Array<{ item: any; error: Error }> = [];

      const chunks = chunkArray(documents, chunkSize);

      try {
        for (const chunk of chunks) {
          const promises = chunk.map(async (docData) => {
            const docId = ID.unique();
            try {
              const res = await databases.createDocument<T & Models.Document>(
                databaseId,
                collectionId,
                docId,
                docData as any,
                options?.permissions
              );
              cacheFusion.setDocument(databaseId, collectionId, res);
              return { success: true, doc: res, id: res.$id };
            } catch (err: any) {
              const errorObj = err instanceof Error ? err : new Error(String(err));
              if (!continueOnError) throw errorObj;
              return { success: false, item: docData, error: errorObj };
            }
          });

          const results = await Promise.all(promises);

          for (const res of results) {
            if (res.success && res.doc) {
              succeeded.push(res.doc);
              succeededIds.push(res.id!);
            } else if (!res.success && res.error) {
              failed.push({ item: res.item, error: res.error });
            }
          }

          completed += chunk.length;
          const currentProgress: BatchProgress = {
            completed,
            total,
            percent: Math.round((completed / total) * 100),
          };
          setProgress(currentProgress);
          options?.onProgress?.(currentProgress);
        }

        setIsLoading(false);
        return { succeeded, succeededIds, failed, totalProcessed: total };
      } catch (err: any) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsLoading(false);
        config.onError?.(err, `useBatchOperations:bulkCreate:${databaseId}/${collectionId}`);
        throw errorObj;
      }
    },
    [databases, databaseId, collectionId, cacheFusion, config]
  );

  const bulkUpdate = useCallback(
    async (
      updates: Array<{ documentId: string; data: Partial<T>; permissions?: string[] }>,
      options?: BatchOperationOptions
    ): Promise<BatchResult<T>> => {
      if (!updates || updates.length === 0) {
        return { succeeded: [], succeededIds: [], failed: [], totalProcessed: 0 };
      }

      setIsLoading(true);
      setError(null);

      const chunkSize = options?.chunkSize || 5;
      const continueOnError = options?.continueOnError !== false;
      const total = updates.length;
      let completed = 0;

      const succeeded: (T & Models.Document)[] = [];
      const succeededIds: string[] = [];
      const failed: Array<{ item: any; error: Error }> = [];

      const chunks = chunkArray(updates, chunkSize);

      try {
        for (const chunk of chunks) {
          const promises = chunk.map(async (u) => {
            try {
              const res = await databases.updateDocument<T & Models.Document>(
                databaseId,
                collectionId,
                u.documentId,
                u.data as any,
                u.permissions
              );
              cacheFusion.setDocument(databaseId, collectionId, res);
              return { success: true, doc: res, id: res.$id };
            } catch (err: any) {
              const errorObj = err instanceof Error ? err : new Error(String(err));
              if (!continueOnError) throw errorObj;
              return { success: false, item: u, error: errorObj };
            }
          });

          const results = await Promise.all(promises);

          for (const res of results) {
            if (res.success && res.doc) {
              succeeded.push(res.doc);
              succeededIds.push(res.id!);
            } else if (!res.success && res.error) {
              failed.push({ item: res.item, error: res.error });
            }
          }

          completed += chunk.length;
          const currentProgress: BatchProgress = {
            completed,
            total,
            percent: Math.round((completed / total) * 100),
          };
          setProgress(currentProgress);
          options?.onProgress?.(currentProgress);
        }

        setIsLoading(false);
        return { succeeded, succeededIds, failed, totalProcessed: total };
      } catch (err: any) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsLoading(false);
        config.onError?.(err, `useBatchOperations:bulkUpdate:${databaseId}/${collectionId}`);
        throw errorObj;
      }
    },
    [databases, databaseId, collectionId, cacheFusion, config]
  );

  const bulkDelete = useCallback(
    async (
      documentIds: string[],
      options?: BatchOperationOptions
    ): Promise<BatchResult<string>> => {
      if (!documentIds || documentIds.length === 0) {
        return { succeeded: [], succeededIds: [], failed: [], totalProcessed: 0 };
      }

      setIsLoading(true);
      setError(null);

      const chunkSize = options?.chunkSize || 5;
      const continueOnError = options?.continueOnError !== false;
      const total = documentIds.length;
      let completed = 0;

      const succeededIds: string[] = [];
      const failed: Array<{ item: any; error: Error }> = [];

      const chunks = chunkArray(documentIds, chunkSize);

      try {
        for (const chunk of chunks) {
          const promises = chunk.map(async (docId) => {
            try {
              await databases.deleteDocument(databaseId, collectionId, docId);
              cacheFusion.removeDocument(databaseId, collectionId, docId);
              return { success: true, id: docId };
            } catch (err: any) {
              const errorObj = err instanceof Error ? err : new Error(String(err));
              if (!continueOnError) throw errorObj;
              return { success: false, item: docId, error: errorObj };
            }
          });

          const results = await Promise.all(promises);

          for (const res of results) {
            if (res.success && res.id) {
              succeededIds.push(res.id);
            } else if (!res.success && res.error) {
              failed.push({ item: res.item, error: res.error });
            }
          }

          completed += chunk.length;
          const currentProgress: BatchProgress = {
            completed,
            total,
            percent: Math.round((completed / total) * 100),
          };
          setProgress(currentProgress);
          options?.onProgress?.(currentProgress);
        }

        setIsLoading(false);
        return {
          succeeded: succeededIds as any,
          succeededIds,
          failed,
          totalProcessed: total,
        };
      } catch (err: any) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsLoading(false);
        config.onError?.(err, `useBatchOperations:bulkDelete:${databaseId}/${collectionId}`);
        throw errorObj;
      }
    },
    [databases, databaseId, collectionId, cacheFusion, config]
  );

  return useMemo(
    () => ({
      bulkCreate,
      bulkUpdate,
      bulkDelete,
      isLoading,
      progress,
      error,
      reset,
    }),
    [bulkCreate, bulkUpdate, bulkDelete, isLoading, progress, error, reset]
  );
}
