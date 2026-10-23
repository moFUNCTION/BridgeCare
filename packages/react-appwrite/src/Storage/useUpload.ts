import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { ID, type Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import type { UseUploadOptions, UploadProgress } from "../types";

export interface UseUploadReturn {
  uploadFile: (file: File, fileId?: string) => Promise<Models.File>;
  uploadFiles: (files: File[]) => Promise<Models.File[]>;
  progress: Record<string, UploadProgress>;
  isUploading: boolean;
  error: Error | null;
  abort: (fileId?: string) => void;
}

export function useUpload(options: UseUploadOptions): UseUploadReturn {
  const { storage, config } = useAppwrite();
  const [progress, setProgress] = useState<Record<string, UploadProgress>>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const onProgressRef = useRef(options.onProgress);
  useEffect(() => {
    onProgressRef.current = options.onProgress;
  }, [options.onProgress]);

  const { bucketId, permissions } = options;
  const permissionsKey = useMemo(
    () => (permissions ? permissions.join(",") : ""),
    [permissions]
  );

  const uploadFile = useCallback(
    async (file: File, fileId: string = ID.unique()): Promise<Models.File> => {
      setIsUploading(true);
      setError(null);

      const controller = new AbortController();
      abortControllersRef.current.set(fileId, controller);

      const initialProgress: UploadProgress = {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        bytesUploaded: 0,
        percentage: 0,
        status: "uploading",
      };

      setProgress((prev) => ({ ...prev, [fileId]: initialProgress }));
      onProgressRef.current?.(initialProgress);

      try {
        const result = await storage.createFile(
          bucketId,
          fileId,
          file,
          permissions,
          (p) => {
            const currentProgress: UploadProgress = {
              fileId,
              fileName: file.name,
              fileSize: file.size,
              bytesUploaded: p.sizeUploaded,
              percentage: Math.round(p.progress),
              status: "uploading",
            };
            setProgress((prev) => ({ ...prev, [fileId]: currentProgress }));
            onProgressRef.current?.(currentProgress);
          }
        );

        setProgress((prev) => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            bytesUploaded: file.size,
            percentage: 100,
            status: "completed",
          },
        }));

        setIsUploading(false);
        abortControllersRef.current.delete(fileId);
        return result;
      } catch (err: any) {
        const isAborted = controller.signal.aborted;
        const errStatus = isAborted ? "aborted" : "error";

        setProgress((prev) => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            status: errStatus,
          },
        }));

        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsUploading(false);
        abortControllersRef.current.delete(fileId);
        config.onError?.(err, `useUpload:uploadFile:${bucketId}/${fileId}`);
        throw errorObj;
      }
    },
    [storage, bucketId, permissionsKey, permissions, config]
  );

  const uploadFiles = useCallback(
    async (files: File[]): Promise<Models.File[]> => {
      const results: Models.File[] = [];
      for (const file of files) {
        const res = await uploadFile(file);
        results.push(res);
      }
      return results;
    },
    [uploadFile]
  );

  const abort = useCallback((fileId?: string) => {
    if (fileId) {
      const ctrl = abortControllersRef.current.get(fileId);
      if (ctrl) {
        ctrl.abort();
        abortControllersRef.current.delete(fileId);
      }
    } else {
      abortControllersRef.current.forEach((ctrl) => ctrl.abort());
      abortControllersRef.current.clear();
    }
  }, []);

  return useMemo(
    () => ({
      uploadFile,
      uploadFiles,
      progress,
      isUploading,
      error,
      abort,
    }),
    [uploadFile, uploadFiles, progress, isUploading, error, abort]
  );
}
