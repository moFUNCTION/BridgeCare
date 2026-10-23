import { useCallback, useMemo } from "react";
import { ImageGravity, ImageFormat } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import type { ImageTransformOptions } from "../types";

export function useFileUrl() {
  const { storage } = useAppwrite();

  const getFileView = useCallback(
    (bucketId: string, fileId: string): string => {
      return storage.getFileView(bucketId, fileId);
    },
    [storage]
  );

  const getFilePreview = useCallback(
    (bucketId: string, fileId: string, options: ImageTransformOptions = {}): string => {
      return storage.getFilePreview(
        bucketId,
        fileId,
        options.width,
        options.height,
        options.gravity as ImageGravity,
        options.quality,
        options.borderWidth,
        options.borderColor,
        options.borderRadius,
        options.opacity,
        options.rotation,
        options.background,
        options.output as ImageFormat
      );
    },
    [storage]
  );

  const getFileDownloadUrl = useCallback(
    (bucketId: string, fileId: string): string => {
      return storage.getFileDownload(bucketId, fileId);
    },
    [storage]
  );

  return useMemo(
    () => ({
      getFileView,
      getFilePreview,
      getFileDownloadUrl,
    }),
    [getFileView, getFilePreview, getFileDownloadUrl]
  );
}
