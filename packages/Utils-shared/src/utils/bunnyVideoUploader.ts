import * as tus from "tus-js-client";

export interface BunnyVideoUploadOptions {
  signedUrl: string;
  file: File | Blob;
  fileSize: number;
  videoId: string;
  libraryId?: number;
  metadata?: Record<string, string>;
  onProgress?: (percentage: number) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

function getUnixTimestampSecondsFromNow(offsetHours: number): number {
  const date = new Date();
  date.setHours(date.getHours() + offsetHours);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Uploads a video to Bunny CDN using the TUS protocol.
 */
export function uploadToBunnyWithTus(options: BunnyVideoUploadOptions): Promise<void> {
  const {
    signedUrl,
    file,
    fileSize,
    videoId,
    libraryId = 388355,
    metadata = {},
    onProgress = () => {},
    onSuccess = () => {},
    onError = () => {},
  } = options;

  return new Promise((resolve, reject) => {
    if (!signedUrl?.trim() || !file || fileSize == null || fileSize <= 0) {
      const err = new Error("Missing required parameters: signedUrl, file, and fileSize are required.");
      onError(err);
      reject(err);
      return;
    }

    const fileName = file instanceof File ? file.name : "video";
    const fileType = file instanceof File ? file.type : "video/mp4";

    const upload = new tus.Upload(file, {
      endpoint: "https://video.bunnycdn.com/tusupload",
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000, 60000],
      headers: {
        AuthorizationSignature: signedUrl,
        AuthorizationExpire: String(getUnixTimestampSecondsFromNow(1)),
        VideoId: videoId,
        LibraryId: String(libraryId),
      },
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
