import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAppwrite } from "../Provider/useAppwrite";
import { buildQueries } from "./queryBuilder";
import { resolveDbAndCollection } from "./helpers";
import type { UseCollectionCountOptions, UseCollectionCountReturn } from "../types";

export function useCollectionCount<T = Record<string, any>>(
  collectionId: string,
  options?: UseCollectionCountOptions<T>
): UseCollectionCountReturn;
export function useCollectionCount<T = Record<string, any>>(
  databaseId: string,
  collectionId: string,
  options?: UseCollectionCountOptions<T>
): UseCollectionCountReturn;
export function useCollectionCount<T = Record<string, any>>(
  arg1: string,
  arg2?: string | UseCollectionCountOptions<T>,
  arg3?: UseCollectionCountOptions<T>
): UseCollectionCountReturn {
  const { databases, client, config } = useAppwrite();
  const { databaseId, collectionId, options } = resolveDbAndCollection<
    UseCollectionCountOptions<T>
  >(config.databaseId, arg1, arg2, arg3);

  const enabled = options.enabled !== false;
  const realtime = options.realtime !== false;

  // Stabilize options
  const serializedWhere = useMemo(
    () => (options.where ? JSON.stringify(options.where) : "{}"),
    [options.where]
  );
  const serializedQueries = useMemo(
    () => (options.queries ? options.queries.join("|") : ""),
    [options.queries]
  );

  const onErrorRef = useRef(options.onError);
  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  const fetchCount = useCallback(async () => {
    if (!enabled || !databaseId || !collectionId) return;

    setLoading(true);
    setError(null);

    try {
      // Query minimal document payload (limit 1, select only $id)
      const queries = buildQueries<T>({
        where: options.where,
        queries: options.queries,
        search: options.search,
        searchField: options.searchField,
        limit: 1,
        select: ["$id"],
      });

      const res = await databases.listDocuments(databaseId, collectionId, queries);

      if (isMountedRef.current) {
        setCount(res.total);
        setLoading(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setLoading(false);
        config.onError?.(err, `useCollectionCount:${databaseId}/${collectionId}`);
        onErrorRef.current?.(errorObj);
      }
    }
  }, [
    databases,
    databaseId,
    collectionId,
    enabled,
    serializedWhere,
    serializedQueries,
    options.search,
    options.searchField,
    config,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchCount();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchCount]);

  // Realtime subscription to keep count live
  useEffect(() => {
    if (!enabled || !realtime || !databaseId || !collectionId) return;

    const channel = `databases.${databaseId}.collections.${collectionId}.documents`;
    const unsubscribe = client.subscribe(channel, (response) => {
      const isCreate = response.events.some((e) => e.endsWith(".create"));
      const isDelete = response.events.some((e) => e.endsWith(".delete"));

      if (isCreate) {
        setCount((prev) => prev + 1);
      } else if (isDelete) {
        setCount((prev) => Math.max(0, prev - 1));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [client, enabled, realtime, databaseId, collectionId]);

  return useMemo(
    () => ({
      count,
      loading,
      error,
      refetch: fetchCount,
    }),
    [count, loading, error, fetchCount]
  );
}
