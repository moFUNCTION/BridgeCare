import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Query, type Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import type { UseDocumentOptions } from "../types";

export interface UseDocumentReturn<T = Record<string, any>> {
  data: (T & Models.Document) | null;
  document: (T & Models.Document) | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDocument<T = Record<string, any>>(
  collectionId: string,
  documentId: string,
  options?: UseDocumentOptions<T>
): UseDocumentReturn<T>;
export function useDocument<T = Record<string, any>>(
  databaseId: string,
  collectionId: string,
  documentId: string,
  options?: UseDocumentOptions<T>
): UseDocumentReturn<T>;
export function useDocument<T = Record<string, any>>(
  arg1: string,
  arg2: string,
  arg3?: string | UseDocumentOptions<T>,
  arg4?: UseDocumentOptions<T>
): UseDocumentReturn<T> {
  const { databases, client, cacheFusion, config } = useAppwrite();

  let databaseId: string;
  let collectionId: string;
  let documentId: string;
  let options: UseDocumentOptions<T>;

  if (typeof arg3 === "string") {
    databaseId = arg1;
    collectionId = arg2;
    documentId = arg3;
    options = arg4 || {};
  } else {
    if (!config.databaseId) {
      throw new Error(
        `[react-appwrite] Database ID was not provided and no default 'databaseId' was configured in <AppwriteProvider>.`
      );
    }
    databaseId = config.databaseId;
    collectionId = arg1;
    documentId = arg2;
    options = (arg3 || {}) as UseDocumentOptions<T>;
  }

  const enabled = options.enabled !== false && !!databaseId && !!collectionId && !!documentId;
  const realtime = options.realtime !== false;

  // Stabilize options.select
  const selectKey = useMemo(
    () => (options.select ? options.select.join(",") : ""),
    [options.select]
  );

  const [document, setDocument] = useState<(T & Models.Document) | null>(() => {
    return enabled
      ? cacheFusion.getDocument<T>(databaseId, collectionId, documentId) || null
      : null;
  });
  const [loading, setLoading] = useState<boolean>(enabled ? !document : false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);

  // Synchronously adjust state during render when docKey changes to eliminate 1-frame tear
  const prevDocKeyRef = useRef<string>(enabled ? `${databaseId}:${collectionId}:${documentId}` : "");
  const currentDocKey = enabled ? `${databaseId}:${collectionId}:${documentId}` : "";
  let effectiveDocument = document;
  let effectiveLoading = loading;
  if (prevDocKeyRef.current !== currentDocKey) {
    prevDocKeyRef.current = currentDocKey;
    if (enabled) {
      const cached = cacheFusion.getDocument<T>(databaseId, collectionId, documentId) || null;
      setDocument(cached);
      setLoading(!cached);
      setError(null);
      effectiveDocument = cached;
      effectiveLoading = !cached;
    } else {
      setDocument(null);
      setLoading(false);
      setError(null);
      effectiveDocument = null;
      effectiveLoading = false;
    }
  }

  // If enabled and we do not have a document or error yet, query is in initial fetch
  const isActuallyLoading = effectiveLoading || (enabled && !effectiveDocument && !error);

  // Sync state whenever enabled, documentId, or collection changes
  useEffect(() => {
    if (!enabled) {
      setDocument(null);
      setLoading(false);
      setError(null);
    } else {
      const cached = cacheFusion.getDocument<T>(databaseId, collectionId, documentId) || null;
      setDocument(cached);
      setLoading(!cached);
    }
  }, [enabled, databaseId, collectionId, documentId, cacheFusion]);

  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onSuccess, options.onError]);

  const queries = useMemo(() => {
    if (options.select && options.select.length > 0) {
      return [Query.select(options.select as string[])];
    }
    return [];
  }, [selectKey]);

  const docKey = `doc:${databaseId}:${collectionId}:${documentId}`;

  const fetchDoc = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const doc = await databases.getDocument<T & Models.Document>(
        databaseId,
        collectionId,
        documentId,
        queries
      );

      if (isMountedRef.current) {
        setDocument(doc);
        setLoading(false);
        cacheFusion.setDocument(databaseId, collectionId, doc);
        onSuccessRef.current?.(doc);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setDocument(null);
        setError(errorObj);
        setLoading(false);
        config.onError?.(err, `useDocument:${databaseId}/${collectionId}/${documentId}`);
        onErrorRef.current?.(errorObj);
      }
    }
  }, [databases, databaseId, collectionId, documentId, queries, enabled, cacheFusion, config]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchDoc();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDoc]);

  // Subscribe to CacheFusion store updates for this document
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = cacheFusion.subscribeToKey(docKey, () => {
      const cached = cacheFusion.getDocument<T>(databaseId, collectionId, documentId);
      if (isMountedRef.current) {
        setDocument(cached || null);
      }
    });

    return unsubscribe;
  }, [cacheFusion, docKey, databaseId, collectionId, documentId, enabled]);

  // Realtime subscription
  useEffect(() => {
    if (!enabled || !realtime) return;

    const channel = `databases.${databaseId}.collections.${collectionId}.documents.${documentId}`;
    const unsubscribeRealtime = client.subscribe(channel, (response) => {
      cacheFusion.handleRealtimeEvent<T>({
        events: response.events,
        channels: response.channels,
        timestamp: response.timestamp,
        payload: response.payload as T & Models.Document,
      });
    });

    return () => {
      unsubscribeRealtime();
    };
  }, [client, enabled, realtime, databaseId, collectionId, documentId, cacheFusion]);

  return useMemo(
    () => ({
      data: effectiveDocument,
      document: effectiveDocument,
      loading: isActuallyLoading,
      error,
      refetch: fetchDoc,
    }),
    [effectiveDocument, isActuallyLoading, error, fetchDoc]
  );
}
