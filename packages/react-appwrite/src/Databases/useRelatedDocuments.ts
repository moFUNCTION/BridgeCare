import { useMemo } from "react";
import { useAppwrite } from "../Provider/useAppwrite";
import { useCollection, type UseCollectionReturn } from "./useCollection";
import type { UseRelatedDocumentsOptions } from "../types";

export function useRelatedDocuments<T = Record<string, any>>(
  targetCollectionId: string,
  parentDocumentId: string,
  relationshipAttribute: string,
  options?: Omit<UseRelatedDocumentsOptions<T>, "relationshipAttribute">
): UseCollectionReturn<T>;
export function useRelatedDocuments<T = Record<string, any>>(
  databaseId: string,
  targetCollectionId: string,
  parentDocumentId: string,
  relationshipAttribute: string,
  options?: Omit<UseRelatedDocumentsOptions<T>, "relationshipAttribute">
): UseCollectionReturn<T>;
export function useRelatedDocuments<T = Record<string, any>>(
  arg1: string,
  arg2: string,
  arg3: string,
  arg4?: string | Omit<UseRelatedDocumentsOptions<T>, "relationshipAttribute">,
  arg5?: Omit<UseRelatedDocumentsOptions<T>, "relationshipAttribute">
): UseCollectionReturn<T> {
  const { config } = useAppwrite();

  let databaseId: string;
  let targetCollectionId: string;
  let parentDocumentId: string;
  let relationshipAttribute: string;
  let options: Omit<UseRelatedDocumentsOptions<T>, "relationshipAttribute">;

  if (typeof arg4 === "string") {
    databaseId = arg1;
    targetCollectionId = arg2;
    parentDocumentId = arg3;
    relationshipAttribute = arg4;
    options = arg5 || {};
  } else {
    if (!config.databaseId) {
      throw new Error(
        `[react-appwrite] Database ID was not provided and no default 'databaseId' was configured in <AppwriteProvider>.`
      );
    }
    databaseId = config.databaseId;
    targetCollectionId = arg1;
    parentDocumentId = arg2;
    relationshipAttribute = arg3;
    options = (arg4 || {}) as Omit<UseRelatedDocumentsOptions<T>, "relationshipAttribute">;
  }

  const whereFilter = useMemo(() => {
    return {
      [relationshipAttribute]: parentDocumentId,
    };
  }, [relationshipAttribute, parentDocumentId]);

  return useCollection<T>(databaseId, targetCollectionId, {
    ...options,
    where: whereFilter as any,
    enabled: options.enabled !== false && !!parentDocumentId,
  });
}
