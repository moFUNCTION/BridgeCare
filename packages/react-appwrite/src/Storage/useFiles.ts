import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";

export interface UseFilesOptions {
  queries?: string[];
  search?: string;
  enabled?: boolean;
}

export interface UseFilesReturn {
  files: Models.File[];
  total: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  getFile: (fileId: string) => Promise<Models.File>;
  updateFile: (
    fileId: string,
    name?: string,
    permissions?: string[]
  ) => Promise<Models.File>;
}

export function useFiles(
  bucketId: string,
  options: UseFilesOptions = {}
): UseFilesReturn {
  const { storage, config } = useAppwrite();
  const [files, setFiles] = useState<Models.File[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);
  const enabled = options.enabled !== false && !!bucketId;

  // Stabilize queries array
  const queriesKey = useMemo(
    () => (options.queries ? options.queries.join("|") : ""),
    [options.queries]
  );

  const fetchFiles = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);
    try {
      const res = await storage.listFiles(
        bucketId,
        options.queries,
        options.search
      );
      if (isMountedRef.current) {
        setFiles(res.files);
        setTotal(res.total);
        setLoading(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        setError(errObj);
        setLoading(false);
        config.onError?.(err, `useFiles:fetchFiles:${bucketId}`);
      }
    }
  }, [storage, bucketId, queriesKey, options.search, enabled, config]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchFiles();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchFiles]);

  const deleteFile = useCallback(
    async (fileId: string): Promise<void> => {
      try {
        await storage.deleteFile(bucketId, fileId);
        setFiles((prev) => prev.filter((f) => f.$id !== fileId));
        setTotal((prev) => Math.max(0, prev - 1));
      } catch (err: any) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        config.onError?.(err, `useFiles:deleteFile:${bucketId}/${fileId}`);
        throw errObj;
      }
    },
    [storage, bucketId, config]
  );

  const getFile = useCallback(
    async (fileId: string): Promise<Models.File> => {
      try {
        return await storage.getFile(bucketId, fileId);
      } catch (err: any) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        config.onError?.(err, `useFiles:getFile:${bucketId}/${fileId}`);
        throw errObj;
      }
    },
    [storage, bucketId, config]
  );

  const updateFile = useCallback(
    async (
      fileId: string,
      name?: string,
      permissions?: string[]
    ): Promise<Models.File> => {
      try {
        const updated = await storage.updateFile(bucketId, fileId, name, permissions);
        setFiles((prev) =>
          prev.map((f) => (f.$id === fileId ? updated : f))
        );
        return updated;
      } catch (err: any) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        config.onError?.(err, `useFiles:updateFile:${bucketId}/${fileId}`);
        throw errObj;
      }
    },
    [storage, bucketId, config]
  );

  return useMemo(
    () => ({
      files,
      total,
      loading,
      error,
      refetch: fetchFiles,
      deleteFile,
      getFile,
      updateFile,
    }),
    [files, total, loading, error, fetchFiles, deleteFile, getFile, updateFile]
  );
}
