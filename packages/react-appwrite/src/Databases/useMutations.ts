import { useState, useCallback, useMemo } from "react";
import { ID, type Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import { resolveDbAndCollection } from "./helpers";

export interface UseMutationsReturn<T = Record<string, any>> {
  createDocument: (
    data: Partial<T>,
    documentId?: string,
    permissions?: string[]
  ) => Promise<T & Models.Document>;
  updateDocument: (
    documentId: string,
    data: Partial<T>,
    permissions?: string[]
  ) => Promise<T & Models.Document>;
  deleteDocument: (documentId: string, softDelete?: boolean) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useMutations<T = Record<string, any>>(
  collectionId: string
): UseMutationsReturn<T>;
export function useMutations<T = Record<string, any>>(
  databaseId: string,
  collectionId: string
): UseMutationsReturn<T>;
export function useMutations<T = Record<string, any>>(
  arg1: string,
  arg2?: string
): UseMutationsReturn<T> {
  const { databases, cacheFusion, config } = useAppwrite();
  const { databaseId, collectionId } = resolveDbAndCollection(config.databaseId, arg1, arg2);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const createDocument = useCallback(
    async (
      data: Partial<T>,
      documentId: string = ID.unique(),
      permissions?: string[]
    ): Promise<T & Models.Document> => {
      setIsLoading(true);
      setError(null);

      // Optimistic document creation
      const optimisticDoc = {
        ...data,
        $id: documentId,
        $databaseId: databaseId,
        $collectionId: collectionId,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        $permissions: permissions || [],
      } as T & Models.Document;

      // Apply optimistic update to cache fusion
      cacheFusion.setDocument(databaseId, collectionId, optimisticDoc);

      try {
        const created = await databases.createDocument<T & Models.Document>(
          databaseId,
          collectionId,
          documentId,
          data as any,
          permissions
        );

        // Commit official server document to cache
        cacheFusion.setDocument(databaseId, collectionId, created);
        setIsLoading(false);
        return created;
      } catch (err: any) {
        // Rollback optimistic create on failure
        cacheFusion.removeDocument(databaseId, collectionId, documentId);

        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsLoading(false);
        config.onError?.(err, `useMutations:createDocument:${databaseId}/${collectionId}`);
        throw errorObj;
      }
    },
    [databases, databaseId, collectionId, cacheFusion, config]
  );

  const updateDocument = useCallback(
    async (
      documentId: string,
      data: Partial<T>,
      permissions?: string[]
    ): Promise<T & Models.Document> => {
      setIsLoading(true);
      setError(null);

      // Backup previous document for rollback
      const previousDoc = cacheFusion.getDocument<T>(databaseId, collectionId, documentId);

      // Apply optimistic update
      if (previousDoc) {
        const optimisticDoc = {
          ...previousDoc,
          ...data,
          $updatedAt: new Date().toISOString(),
          ...(permissions ? { $permissions: permissions } : {}),
        } as T & Models.Document;
        cacheFusion.setDocument(databaseId, collectionId, optimisticDoc);
      }

      try {
        const updated = await databases.updateDocument<T & Models.Document>(
          databaseId,
          collectionId,
          documentId,
          data as any,
          permissions
        );

        cacheFusion.setDocument(databaseId, collectionId, updated);
        setIsLoading(false);
        return updated;
      } catch (err: any) {
        // Rollback on failure
        if (previousDoc) {
          cacheFusion.setDocument(databaseId, collectionId, previousDoc);
        }

        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsLoading(false);
        config.onError?.(err, `useMutations:updateDocument:${databaseId}/${collectionId}/${documentId}`);
        throw errorObj;
      }
    },
    [databases, databaseId, collectionId, cacheFusion, config]
  );

  const deleteDocument = useCallback(
    async (documentId: string, softDelete: boolean = false): Promise<void> => {
      setIsLoading(true);
      setError(null);

      if (softDelete) {
        await updateDocument(documentId, {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        } as any);
        return;
      }

      // Backup previous document for rollback
      const previousDoc = cacheFusion.getDocument<T>(databaseId, collectionId, documentId);

      // Optimistic delete
      cacheFusion.removeDocument(databaseId, collectionId, documentId);

      try {
        await databases.deleteDocument(databaseId, collectionId, documentId);
        setIsLoading(false);
      } catch (err: any) {
        // Rollback on failure
        if (previousDoc) {
          cacheFusion.setDocument(databaseId, collectionId, previousDoc);
        }

        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsLoading(false);
        config.onError?.(err, `useMutations:deleteDocument:${databaseId}/${collectionId}/${documentId}`);
        throw errorObj;
      }
    },
    [databases, databaseId, collectionId, cacheFusion, updateDocument, config]
  );

  return useMemo(
    () => ({
      createDocument,
      updateDocument,
      deleteDocument,
      isLoading,
      error,
    }),
    [createDocument, updateDocument, deleteDocument, isLoading, error]
  );
}
