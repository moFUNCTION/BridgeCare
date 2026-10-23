import React, { useState, useMemo } from "react";
import { useFileUrl } from "./useFileUrl";
import type { ImageTransformOptions } from "../types";

export interface AppwriteImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  bucketId: string;
  fileId: string;
  transformations?: ImageTransformOptions;
  fallbackSrc?: string;
  loadingPlaceholder?: React.ReactNode;
}

export const AppwriteImage: React.FC<AppwriteImageProps> = ({
  bucketId,
  fileId,
  transformations,
  fallbackSrc,
  loadingPlaceholder,
  alt = "Appwrite Image",
  className,
  style,
  onLoad,
  onError,
  ...rest
}) => {
  const { getFilePreview } = useFileUrl();
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const imageUrl = useMemo(() => {
    if (!bucketId || !fileId) return fallbackSrc || "";
    try {
      return getFilePreview(bucketId, fileId, transformations);
    } catch {
      return fallbackSrc || "";
    }
  }, [bucketId, fileId, transformations, fallbackSrc, getFilePreview]);

  if (hasError && fallbackSrc) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        style={style}
        {...rest}
      />
    );
  }

  return (
    <>
      {!isLoaded && loadingPlaceholder}
      <img
        src={imageUrl}
        alt={alt}
        className={className}
        style={{
          ...style,
          display: isLoaded || !loadingPlaceholder ? style?.display : "none",
        }}
        onLoad={(e) => {
          setIsLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setHasError(true);
          onError?.(e);
        }}
        {...rest}
      />
    </>
  );
};
