import { useState, useCallback, useMemo } from "react";
import type { Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import { resolveDbAndCollection } from "./helpers";
import type { UseDocumentOperationsReturn } from "../types";

export function useDocumentOperations<T = Record<string, any>>(
  collectionId: string
): UseDocumentOperationsReturn<T>;
export function useDocumentOperations<T = Record<string, any>>(
  databaseId: string,
  collectionId: string
): UseDocumentOperationsReturn<T>;
export function useDocumentOperations<T = Record<string, any>>(
  arg1: string,
  arg2?: string
): UseDocumentOperationsReturn<T> {
  const { databases, cacheFusion, config } = useAppwrite();
  const { databaseId, collectionId } = resolveDbAndCollection(config.databaseId, arg1, arg2);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Helper to get fresh or cached document
  const getDoc = useCallback(
    async (documentId: string): Promise<T & Models.Document> => {
      const cached = cacheFusion.getDocument<T>(databaseId, collectionId, documentId);
      if (cached) return cached;
      const fetched = await databases.getDocument<T & Models.Document>(
        databaseId,
        collectionId,
        documentId
      );
      cacheFusion.setDocument(databaseId, collectionId, fetched);
      return fetched;
    },
    [databases, databaseId, collectionId, cacheFusion]
  );

  const patchDocument = useCallback(
    async (
      documentId: string,
      data: Partial<T>,
      permissions?: string[]
    ): Promise<T & Models.Document> => {
      setIsLoading(true);
      setError(null);

      const previousDoc = cacheFusion.getDocument<T>(databaseId, collectionId, documentId);

      // Optimistic cache update
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
        if (previousDoc) {
          cacheFusion.setDocument(databaseId, collectionId, previousDoc);
        }
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsLoading(false);
        config.onError?.(
          err,
          `useDocumentOperations:patchDocument:${databaseId}/${collectionId}/${documentId}`
        );
        throw errorObj;
      }
    },
    [databases, databaseId, collectionId, cacheFusion, config]
  );

  const upsertDocument = useCallback(
    async (
      documentId: string,
      data: Partial<T>,
      permissions?: string[]
    ): Promise<T & Models.Document> => {
      setIsLoading(true);
      setError(null);

      try {
        // Try updating first
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
        const isNotFound =
          err?.code === 404 ||
          err?.type === "document_not_found" ||
          String(err?.message).toLowerCase().includes("could not be found");

        if (isNotFound) {
          try {
            // Create document with the specified ID
            const created = await databases.createDocument<T & Models.Document>(
              databaseId,
              collectionId,
              documentId,
              data as any,
              permissions
            );
            cacheFusion.setDocument(databaseId, collectionId, created);
            setIsLoading(false);
            return created;
          } catch (createErr: any) {
            const errorObj =
              createErr instanceof Error ? createErr : new Error(String(createErr));
            setError(errorObj);
            setIsLoading(false);
            config.onError?.(
              createErr,
              `useDocumentOperations:upsertDocument:create:${databaseId}/${collectionId}/${documentId}`
            );
            throw errorObj;
          }
        }

        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsLoading(false);
        config.onError?.(
          err,
          `useDocumentOperations:upsertDocument:update:${databaseId}/${collectionId}/${documentId}`
        );
        throw errorObj;
      }
    },
    [databases, databaseId, collectionId, cacheFusion, config]
  );

  const incrementField = useCallback(
    async (
      documentId: string,
      field: keyof T | string,
      amount: number = 1
    ): Promise<T & Models.Document> => {
      const doc = await getDoc(documentId);
      const currentVal = Number((doc as any)[field]) || 0;
      const newVal = currentVal + amount;
      return patchDocument(documentId, { [field]: newVal } as any);
    },
    [getDoc, patchDocument]
  );

  const decrementField = useCallback(
    async (
      documentId: string,
      field: keyof T | string,
      amount: number = 1
    ): Promise<T & Models.Document> => {
      return incrementField(documentId, field, -amount);
    },
    [incrementField]
  );

  const arrayUnion = useCallback(
    async (
      documentId: string,
      field: keyof T | string,
      items: any | any[]
    ): Promise<T & Models.Document> => {
      const doc = await getDoc(documentId);
      const currentArr: any[] = Array.isArray((doc as any)[field])
        ? [...(doc as any)[field]]
        : [];
      const itemsToAdd = Array.isArray(items) ? items : [items];

      for (const item of itemsToAdd) {
        if (!currentArr.includes(item)) {
          currentArr.push(item);
        }
      }

      return patchDocument(documentId, { [field]: currentArr } as any);
    },
    [getDoc, patchDocument]
  );

  const arrayRemove = useCallback(
    async (
      documentId: string,
      field: keyof T | string,
      items: any | any[]
    ): Promise<T & Models.Document> => {
      const doc = await getDoc(documentId);
      const currentArr: any[] = Array.isArray((doc as any)[field])
        ? [...(doc as any)[field]]
        : [];
      const itemsToRemove = Array.isArray(items) ? items : [items];

      const filtered = currentArr.filter((val) => !itemsToRemove.includes(val));
      return patchDocument(documentId, { [field]: filtered } as any);
    },
    [getDoc, patchDocument]
  );

  const softDelete = useCallback(
    async (
      documentId: string,
      softDeleteField: string = "isDeleted"
    ): Promise<T & Models.Document> => {
      return patchDocument(documentId, {
        [softDeleteField]: true,
        deletedAt: new Date().toISOString(),
      } as any);
    },
    [patchDocument]
  );

  const restore = useCallback(
    async (
      documentId: string,
      softDeleteField: string = "isDeleted"
    ): Promise<T & Models.Document> => {
      return patchDocument(documentId, {
        [softDeleteField]: false,
        deletedAt: null,
      } as any);
    },
    [patchDocument]
  );

  return useMemo(
    () => ({
      upsertDocument,
      patchDocument,
      incrementField,
      decrementField,
      arrayUnion,
      arrayRemove,
      softDelete,
      restore,
      isLoading,
      error,
    }),
    [
      upsertDocument,
      patchDocument,
      incrementField,
      decrementField,
      arrayUnion,
      arrayRemove,
      softDelete,
      restore,
      isLoading,
      error,
    ]
  );
}
