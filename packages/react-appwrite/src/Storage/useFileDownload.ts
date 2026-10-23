import { useState, useCallback, useMemo } from "react";
import { useAppwrite } from "../Provider/useAppwrite";

export function useFileDownload() {
  const { storage, config } = useAppwrite();
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadFile = useCallback(
    async (bucketId: string, fileId: string, customFileName?: string): Promise<Blob> => {
      setIsDownloading(true);
      setError(null);

      try {
        const downloadUrl = storage.getFileDownload(bucketId, fileId);
        const res = await fetch(downloadUrl);
        if (!res.ok) {
          throw new Error(`Failed to download file: ${res.status} ${res.statusText}`);
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = customFileName || fileId;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setIsDownloading(false);
        return blob;
      } catch (err: any) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        setError(errObj);
        setIsDownloading(false);
        config.onError?.(err, `useFileDownload:${bucketId}/${fileId}`);
        throw errObj;
      }
    },
    [storage, config]
  );

  return useMemo(
    () => ({
      downloadFile,
      isDownloading,
      error,
    }),
    [downloadFile, isDownloading, error]
  );
}
