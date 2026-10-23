import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import { buildQueries } from "./queryBuilder";
import { resolveDbAndCollection } from "./helpers";
import type { UseInfiniteCollectionOptions, WhereFilter } from "../types";

export interface UseInfiniteCollectionReturn<T = Record<string, any>> {
  data: (T & Models.Document)[];
  documents: (T & Models.Document)[];
  total: number;
  loading: boolean;
  isFetchingNextPage: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  hasMore: boolean;
  error: Error | null;
  search: string;
  setSearch: (search: string) => void;
  setFilter: (where: WhereFilter<T> | ((prev: WhereFilter<T>) => WhereFilter<T>)) => void;
  fetchNextPage: () => Promise<void>;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useInfiniteCollection<T = Record<string, any>>(
  collectionId: string,
  options?: UseInfiniteCollectionOptions<T>
): UseInfiniteCollectionReturn<T>;
export function useInfiniteCollection<T = Record<string, any>>(
  databaseId: string,
  collectionId: string,
  options?: UseInfiniteCollectionOptions<T>
): UseInfiniteCollectionReturn<T>;
export function useInfiniteCollection<T = Record<string, any>>(
  arg1: string,
  arg2?: string | UseInfiniteCollectionOptions<T>,
  arg3?: UseInfiniteCollectionOptions<T>
): UseInfiniteCollectionReturn<T> {
  const { databases, client, cacheFusion, config } = useAppwrite();
  const { databaseId, collectionId, options } = resolveDbAndCollection<
    UseInfiniteCollectionOptions<T>
  >(config.databaseId, arg1, arg2, arg3);

  const enabled = options.enabled !== false;
  const realtime = options.realtime !== false;
  const pageSize = options.pageSize || options.limit || 20;
  const searchDebounceMs = options.searchDebounceMs || 300;

  // Stabilize complex option objects
  const serializedWhere = useMemo(
    () => (options.where ? JSON.stringify(options.where) : "{}"),
    [options.where]
  );
  const serializedQueries = useMemo(
    () => (options.queries ? options.queries.join("|") : ""),
    [options.queries]
  );
  const serializedSelect = useMemo(
    () => (options.select ? options.select.join(",") : ""),
    [options.select]
  );
  const serializedSort = useMemo(
    () => (options.sort ? JSON.stringify(options.sort) : ""),
    [options.sort]
  );

  const [search, setSearchState] = useState<string>(options.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState<string>(options.search || "");
  const [filter, setFilterState] = useState<WhereFilter<T>>(options.where || {});
  const [sortField] = useState<string | undefined>(options.sortField as string | undefined);
  const [sortOrder] = useState<"asc" | "desc" | undefined>(options.sortOrder);

  // Sync external where changes
  const prevSerializedWhereRef = useRef(serializedWhere);
  useEffect(() => {
    if (prevSerializedWhereRef.current !== serializedWhere) {
      prevSerializedWhereRef.current = serializedWhere;
      setFilterState(options.where || {});
    }
  }, [serializedWhere, options.where]);

  const [pages, setPages] = useState<(T & Models.Document)[][]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);
  const lastDocIdRef = useRef<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, searchDebounceMs);

    return () => clearTimeout(timer);
  }, [search, searchDebounceMs]);

  // Initial fetch / reset on filter/search change
  const fetchInitial = useCallback(async () => {
    if (!enabled || !databaseId || !collectionId) return;

    setLoading(true);
    setError(null);
    lastDocIdRef.current = null;

    try {
      const queries = buildQueries<T>({
        queries: options.queries,
        where: filter,
        search: debouncedSearch,
        searchField: options.searchField,
        select: options.select,
        limit: pageSize,
        sort: options.sort,
        sortField,
        sortOrder,
      });

      const res = await databases.listDocuments<T & Models.Document>(
        databaseId,
        collectionId,
        queries
      );

      if (isMountedRef.current) {
        setPages([res.documents]);
        setTotal(res.total);
        setLoading(false);

        if (res.documents.length > 0) {
          lastDocIdRef.current = res.documents[res.documents.length - 1].$id;
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setLoading(false);
        config.onError?.(err, `useInfiniteCollection:fetchInitial:${databaseId}/${collectionId}`);
      }
    }
  }, [
    databases,
    databaseId,
    collectionId,
    filter,
    debouncedSearch,
    serializedQueries,
    serializedSort,
    serializedSelect,
    options.searchField,
    pageSize,
    sortField,
    sortOrder,
    enabled,
    config,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchInitial();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchInitial]);

  // Fetch next page
  const fetchNextPage = useCallback(async () => {
    if (isFetchingNextPage || loading || !lastDocIdRef.current) return;

    setIsFetchingNextPage(true);

    try {
      const queries = buildQueries<T>({
        queries: options.queries,
        where: filter,
        search: debouncedSearch,
        searchField: options.searchField,
        select: options.select,
        limit: pageSize,
        cursor: lastDocIdRef.current,
        cursorType: "after",
        sort: options.sort,
        sortField,
        sortOrder,
      });

      const res = await databases.listDocuments<T & Models.Document>(
        databaseId,
        collectionId,
        queries
      );

      if (isMountedRef.current) {
        if (res.documents.length > 0) {
          setPages((prev) => [...prev, res.documents]);
          lastDocIdRef.current = res.documents[res.documents.length - 1].$id;
        }
        setIsFetchingNextPage(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsFetchingNextPage(false);
        config.onError?.(err, `useInfiniteCollection:fetchNextPage:${databaseId}/${collectionId}`);
      }
    }
  }, [
    isFetchingNextPage,
    loading,
    databases,
    databaseId,
    collectionId,
    filter,
    debouncedSearch,
    serializedQueries,
    serializedSort,
    serializedSelect,
    options.searchField,
    pageSize,
    sortField,
    sortOrder,
    config,
  ]);

  // Realtime subscription
  useEffect(() => {
    if (!enabled || !realtime || !databaseId || !collectionId) return;

    const channel = `databases.${databaseId}.collections.${collectionId}.documents`;
    const unsubscribe = client.subscribe(channel, (response) => {
      cacheFusion.handleRealtimeEvent<T>({
        events: response.events,
        channels: response.channels,
        timestamp: response.timestamp,
        payload: response.payload as T & Models.Document,
      });

      const isDelete = response.events.some((e) => e.endsWith(".delete"));
      const isUpdate = response.events.some((e) => e.endsWith(".update"));
      const doc = response.payload as T & Models.Document;

      if (isDelete && doc.$id) {
        setPages((prevPages) =>
          prevPages.map((page) => page.filter((d) => d.$id !== doc.$id))
        );
        setTotal((prev) => Math.max(0, prev - 1));
      } else if (isUpdate && doc.$id) {
        setPages((prevPages) =>
          prevPages.map((page) =>
            page.map((d) => (d.$id === doc.$id ? { ...d, ...doc } : d))
          )
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [client, enabled, realtime, databaseId, collectionId, cacheFusion]);

  // Flatten and deduplicate documents by $id
  const documents = useMemo(() => {
    const flat = pages.flat();
    const seen = new Set<string>();
    const unique: (T & Models.Document)[] = [];
    for (const doc of flat) {
      if (!seen.has(doc.$id)) {
        seen.add(doc.$id);
        unique.push(doc);
      }
    }
    return unique;
  }, [pages]);

  const hasNextPage = useMemo(() => {
    return documents.length < total;
  }, [documents.length, total]);

  const setSearch = useCallback((s: string) => {
    setSearchState(s);
  }, []);

  const setFilter = useCallback(
    (newFilter: WhereFilter<T> | ((prev: WhereFilter<T>) => WhereFilter<T>)) => {
      setFilterState(newFilter);
    },
    []
  );

  return useMemo(
    () => ({
      data: documents,
      documents,
      total,
      loading,
      isFetchingNextPage,
      isLoadingMore: isFetchingNextPage,
      hasNextPage,
      hasMore: hasNextPage,
      error,
      search,
      setSearch,
      setFilter,
      fetchNextPage,
      loadMore: fetchNextPage,
      refetch: fetchInitial,
    }),
    [
      documents,
      total,
      loading,
      isFetchingNextPage,
      hasNextPage,
      error,
      search,
      setSearch,
      setFilter,
      fetchNextPage,
      fetchInitial,
    ]
  );
}
