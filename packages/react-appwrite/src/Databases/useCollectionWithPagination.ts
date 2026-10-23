import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import { buildQueries } from "./queryBuilder";
import { resolveDbAndCollection } from "./helpers";
import type {
  UseCollectionWithPaginationOptions,
  UseCollectionWithPaginationReturn,
  WhereFilter,
} from "../types";

export function useCollectionWithPagination<T = Record<string, any>>(
  collectionId: string,
  options?: UseCollectionWithPaginationOptions<T>
): UseCollectionWithPaginationReturn<T>;
export function useCollectionWithPagination<T = Record<string, any>>(
  databaseId: string,
  collectionId: string,
  options?: UseCollectionWithPaginationOptions<T>
): UseCollectionWithPaginationReturn<T>;
export function useCollectionWithPagination<T = Record<string, any>>(
  arg1: string,
  arg2?: string | UseCollectionWithPaginationOptions<T>,
  arg3?: UseCollectionWithPaginationOptions<T>
): UseCollectionWithPaginationReturn<T> {
  const { databases, client, cacheFusion, config } = useAppwrite();
  const { databaseId, collectionId, options } = resolveDbAndCollection<
    UseCollectionWithPaginationOptions<T>
  >(config.databaseId, arg1, arg2, arg3);

  const enabled = options.enabled !== false;
  const realtime = options.realtime !== false;
  const initialPageSize = options.pageSize || options.limit || 20;
  const searchDebounceMs = options.searchDebounceMs || 300;
  const paginationMode = options.paginationMode || "auto";

  // Stabilize complex option objects to prevent infinite render loops
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

  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [page, setPageState] = useState<number>(options.initialPage || 1);
  const [search] = useState<string>(options.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState<string>(options.search || "");
  const [filter, setFilterState] = useState<WhereFilter<T>>(options.where || {});

  // Sync external where changes
  const prevSerializedWhereRef = useRef(serializedWhere);
  useEffect(() => {
    if (prevSerializedWhereRef.current !== serializedWhere) {
      prevSerializedWhereRef.current = serializedWhere;
      setFilterState(options.where || {});
    }
  }, [serializedWhere, options.where]);

  const [documents, setDocuments] = useState<(T & Models.Document)[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);
  const cursorMapRef = useRef<Map<number, { firstDocId?: string; lastDocId?: string }>>(new Map());

  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);
  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onSuccess, options.onError]);

  // Debounce search string
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, searchDebounceMs);
    return () => clearTimeout(timer);
  }, [search, searchDebounceMs]);

  // Reset page when filter or search changes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPageState(1);
    cursorMapRef.current.clear();
  }, [debouncedSearch, serializedWhere]);

  const fetchPage = useCallback(
    async (targetPage: number) => {
      if (!enabled || !databaseId || !collectionId) return;

      setLoading(true);
      setError(null);

      try {
        const offsetVal = (targetPage - 1) * pageSize;
        // In Appwrite, Query.offset cannot exceed 5000 items
        const shouldUseCursor =
          paginationMode === "cursor" ||
          (paginationMode === "auto" && offsetVal >= 5000);

        let queryOptions: any = {
          where: filter,
          queries: options.queries,
          sort: options.sort,
          sortField: options.sortField,
          sortOrder: options.sortOrder,
          search: debouncedSearch,
          searchField: options.searchField,
          select: options.select,
          limit: pageSize,
        };

        if (shouldUseCursor && targetPage > 1) {
          // Check if we have the cursor of the preceding page
          const prevPageCursor = cursorMapRef.current.get(targetPage - 1);
          if (prevPageCursor?.lastDocId) {
            queryOptions.cursor = prevPageCursor.lastDocId;
            queryOptions.cursorType = "after";
          } else {
            queryOptions.page = targetPage;
          }
        } else {
          queryOptions.page = targetPage;
        }

        const queryStrings = buildQueries<T>(queryOptions);
        const res = await databases.listDocuments<T & Models.Document>(
          databaseId,
          collectionId,
          queryStrings
        );

        if (isMountedRef.current) {
          setDocuments(res.documents);
          setTotal(res.total);
          setPageState(targetPage);
          setLoading(false);

          if (res.documents.length > 0) {
            cursorMapRef.current.set(targetPage, {
              firstDocId: res.documents[0].$id,
              lastDocId: res.documents[res.documents.length - 1].$id,
            });
          }

          onSuccessRef.current?.(res.documents, res.total);
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          const errorObj = err instanceof Error ? err : new Error(String(err));
          setError(errorObj);
          setLoading(false);
          config.onError?.(
            err,
            `useCollectionWithPagination:${databaseId}/${collectionId}`
          );
          onErrorRef.current?.(errorObj);
        }
      }
    },
    [
      enabled,
      databaseId,
      collectionId,
      pageSize,
      filter,
      debouncedSearch,
      paginationMode,
      databases,
      serializedQueries,
      serializedSort,
      serializedSelect,
      options.sortField,
      options.sortOrder,
      options.searchField,
      config,
    ]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchPage(page);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchPage, page]);

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

      const isCreate = response.events.some((e) => e.endsWith(".create"));
      const isDelete = response.events.some((e) => e.endsWith(".delete"));
      const isUpdate = response.events.some((e) => e.endsWith(".update"));
      const doc = response.payload as T & Models.Document;

      if (isDelete && doc.$id) {
        setDocuments((prev) => prev.filter((d) => d.$id !== doc.$id));
        setTotal((prev) => Math.max(0, prev - 1));
      } else if (isUpdate && doc.$id) {
        setDocuments((prev) =>
          prev.map((d) => (d.$id === doc.$id ? { ...d, ...doc } : d))
        );
      } else if (isCreate && doc.$id && page === 1) {
        setDocuments((prev) => [doc, ...prev.slice(0, pageSize - 1)]);
        setTotal((prev) => prev + 1);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [client, enabled, realtime, databaseId, collectionId, cacheFusion, page, pageSize]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPrevPage = useMemo(() => page > 1, [page]);

  const nextPage = useCallback(async () => {
    if (hasNextPage) {
      await fetchPage(page + 1);
    }
  }, [hasNextPage, fetchPage, page]);

  const prevPage = useCallback(async () => {
    if (hasPrevPage) {
      await fetchPage(page - 1);
    }
  }, [hasPrevPage, fetchPage, page]);

  const goToPage = useCallback(
    async (targetPage: number) => {
      const bounded = Math.max(1, Math.min(targetPage, totalPages));
      await fetchPage(bounded);
    },
    [totalPages, fetchPage]
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageState(1);
    cursorMapRef.current.clear();
  }, []);

  const resetPage = useCallback(() => {
    setPageState(1);
    cursorMapRef.current.clear();
  }, []);

  const refetch = useCallback(async () => {
    await fetchPage(page);
  }, [fetchPage, page]);

  return useMemo(
    () => ({
      data: documents,
      documents,
      loading,
      error,
      page,
      pageSize,
      totalCount: total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      isFirstPage: page === 1,
      isLastPage: page === totalPages,
      nextPage,
      prevPage,
      goToPage,
      setPageSize,
      resetPage,
      refetch,
    }),
    [
      documents,
      loading,
      error,
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
      goToPage,
      setPageSize,
      resetPage,
      refetch,
    ]
  );
}
