import * as tus from "tus-js-client";

export interface VimeoVideoUploadOptions {
  signedUrl: string;
  file: File | Blob;
  fileSize: number;
  metadata?: Record<string, string>;
  onProgress?: (percentage: number) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Uploads a video to Vimeo using the TUS protocol.
 */
export function uploadToVimeoWithTus(
  options: VimeoVideoUploadOptions
): Promise<void> {
  const {
    signedUrl,
    file,
    fileSize,
    metadata = {},
    onProgress = () => {},
    onSuccess = () => {},
    onError = () => {},
  } = options;

  return new Promise((resolve, reject) => {
    if (!signedUrl?.trim() || !file || fileSize == null || fileSize <= 0) {
      const err = new Error(
        "Missing required parameters: signedUrl, file, and fileSize are required."
      );
      onError(err);
      reject(err);
      return;
    }

    const fileName = file instanceof File ? file.name : "video";
    const fileType = file instanceof File ? file.type : "video/mp4";

    const upload = new tus.Upload(file, {
      uploadUrl: signedUrl,
      metadata: {
        filename: fileName,
        filetype: fileType,
        ...metadata,
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage =
          bytesTotal > 0 ? (bytesUploaded / bytesTotal) * 100 : 0;
        onProgress(Number(percentage.toFixed(2)));
      },
      onSuccess: () => {
        onSuccess();
        resolve();
      },
      onError: (error: Error) => {
        onError(error);
        reject(error);
      },
    });

    upload.start();
  });
}
