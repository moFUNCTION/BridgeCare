import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Query, type Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import { resolveDbAndCollection } from "./helpers";
import { parseWhereClause } from "./queryBuilder";
import type { UseSearchDocumentsOptions, UseSearchDocumentsReturn } from "../types";

export function useSearchDocuments<T = Record<string, any>>(
  collectionId: string,
  options: UseSearchDocumentsOptions<T>
): UseSearchDocumentsReturn<T>;
export function useSearchDocuments<T = Record<string, any>>(
  databaseId: string,
  collectionId: string,
  options: UseSearchDocumentsOptions<T>
): UseSearchDocumentsReturn<T>;
export function useSearchDocuments<T = Record<string, any>>(
  arg1: string,
  arg2: string | UseSearchDocumentsOptions<T>,
  arg3?: UseSearchDocumentsOptions<T>
): UseSearchDocumentsReturn<T> {
  const { databases, config } = useAppwrite();
  const { databaseId, collectionId, options } = resolveDbAndCollection<
    UseSearchDocumentsOptions<T>
  >(config.databaseId, arg1, arg2, arg3);

  const debounceMs = options.debounceMs || 300;
  const minChars = options.minChars !== undefined ? options.minChars : 2;
  const limit = options.limit || 25;
  const enabled = options.enabled !== false;
  const storeRecent = options.storeRecent !== false;
  const recentStorageKey =
    options.recentStorageKey || `appwrite_recent_search_${collectionId}`;

  // Stabilize complex option properties
  const searchFieldsKey = useMemo(
    () => (options.searchFields ? (options.searchFields as string[]).join(",") : ""),
    [options.searchFields]
  );
  const serializedWhere = useMemo(
    () => (options.where ? JSON.stringify(options.where) : "{}"),
    [options.where]
  );
  const selectKey = useMemo(
    () => (options.select ? (options.select as string[]).join(",") : ""),
    [options.select]
  );

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedTerm, setDebouncedTerm] = useState<string>("");
  const [results, setResults] = useState<(T & Models.Document)[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined" || !storeRecent) return [];
    try {
      const stored = localStorage.getItem(recentStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const isMountedRef = useRef(true);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Execute search
  const executeSearch = useCallback(async () => {
    const term = debouncedTerm.trim();

    if (!enabled || !term || term.length < minChars) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queries: string[] = [];

      // Append search fields
      if (options.searchFields && options.searchFields.length > 0) {
        if (options.searchFields.length === 1) {
          queries.push(Query.search(options.searchFields[0] as string, term));
        } else {
          const searchBranches = options.searchFields.map((f) =>
            Query.search(f as string, term)
          );
          queries.push(Query.or(searchBranches));
        }
      }

      // Where filter
      if (options.where) {
        queries.push(...parseWhereClause<T>(options.where));
      }

      // Select projection
      if (options.select && options.select.length > 0) {
        queries.push(Query.select(options.select as string[]));
      }

      // Sort
      if (options.sortField) {
        if (options.sortOrder === "desc") {
          queries.push(Query.orderDesc(options.sortField as string));
        } else {
          queries.push(Query.orderAsc(options.sortField as string));
        }
      }

      queries.push(Query.limit(limit));

      const res = await databases.listDocuments<T & Models.Document>(
        databaseId,
        collectionId,
        queries
      );

      if (isMountedRef.current) {
        setResults(res.documents);
        setLoading(false);

        // Store to recent searches
        if (storeRecent && term.length >= minChars && typeof window !== "undefined") {
          setRecentSearches((prev) => {
            const updated = [term, ...prev.filter((item) => item !== term)].slice(0, 10);
            try {
              localStorage.setItem(recentStorageKey, JSON.stringify(updated));
            } catch {
              // ignore storage errors
            }
            return updated;
          });
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setLoading(false);
        config.onError?.(err, `useSearchDocuments:${databaseId}/${collectionId}`);
      }
    }
  }, [
    debouncedTerm,
    enabled,
    minChars,
    searchFieldsKey,
    serializedWhere,
    selectKey,
    options.sortField,
    options.sortOrder,
    databaseId,
    collectionId,
    limit,
    databases,
    storeRecent,
    recentStorageKey,
    config,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    executeSearch();

    return () => {
      isMountedRef.current = false;
    };
  }, [executeSearch]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(recentStorageKey);
      } catch {
        // ignore
      }
    }
  }, [recentStorageKey]);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedTerm("");
    setResults([]);
  }, []);

  return useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      results,
      loading,
      error,
      recentSearches,
      clearRecentSearches,
      clearSearch,
      refetch: executeSearch,
    }),
    [
      searchTerm,
      setSearchTerm,
      results,
      loading,
      error,
      recentSearches,
      clearRecentSearches,
      clearSearch,
      executeSearch,
    ]
  );
}
