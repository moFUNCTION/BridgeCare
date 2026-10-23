# Storage & Media Module

The Storage module handles file management, chunked multi-file uploads with real-time percentage progress, dynamic image preview transformations, and browser file downloads.

---

## 1. `useUpload(options)`

Multi-file chunked uploader supporting files of all sizes (with automatic chunking > 5MB), cancellation via `AbortController`, and progress tracking.

### Options

| Option | Type | Description |
|---|---|---|
| `bucketId` | `string` | **Required** Appwrite Storage Bucket ID. |
| `onProgress` | `(progress: UploadProgress) => void` | Optional progress callback per file. |
| `onSuccess` | `(file: Models.File) => void` | Callback when upload completes successfully. |
| `onError` | `(error: Error) => void` | Callback on upload error. |
| `permissions` | `string[]` | Optional custom file permissions. |

### Returns

```ts
interface UseUploadReturn {
  uploadFile: (file: File, fileId?: string) => Promise<Models.File>;
  uploadFiles: (files: File[]) => Promise<Models.File[]>;
  progress: Record<string, UploadProgress>;
  isUploading: boolean;
  error: Error | null;
  abort: (fileId?: string) => void;
}
```

### Example

```tsx
import React from "react";
import { useUpload } from "@repo/react-appwrite";

export function FileUploader() {
  const { uploadFiles, progress, isUploading, abort } = useUpload({
    bucketId: "documents_bucket",
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      await uploadFiles(filesArray);
    }
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} disabled={isUploading} />

      {isUploading && (
        <button type="button" onClick={() => abort()}>
          Cancel Uploads
        </button>
      )}

      <ul>
        {Object.values(progress).map((p) => (
          <li key={p.fileId}>
            {p.fileName}: {p.percentage}% ({p.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 2. `useFileUrl()`

Helper hook to construct image transformation and file view URLs.

### Methods

- `getFileView(bucketId, fileId)`: Direct URL to view the raw file in the browser.
- `getFileDownloadUrl(bucketId, fileId)`: URL to trigger direct file download.
- `getFilePreview(bucketId, fileId, options)`: Dynamic image transformation URL.

### Image Transformation Options

| Parameter | Type | Description |
|---|---|---|
| `width` | `number` | Target image width in pixels. |
| `height` | `number` | Target image height in pixels. |
| `gravity` | `ImageGravity` | Crop focus anchor (`"center"`, `"top-left"`, `"bottom"`, etc.). |
| `quality` | `number` | Compression quality (`1-100`). |
| `borderRadius` | `number` | Corner radius in pixels (e.g. `100` for circle). |
| `borderWidth` | `number` | Border stroke width. |
| `borderColor` | `string` | Hex border color. |
| `opacity` | `number` | Image opacity (`0-1`). |
| `rotation` | `number` | Rotation angle (`0-360`). |
| `output` | `"jpg" \| "png" \| "webp" \| "avif"` | Target image format. |

---

## 3. `<AppwriteImage>`

Responsive React Image component that automatically generates optimized preview URLs.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `bucketId` | `string` | **Required** | Storage bucket ID. |
| `fileId` | `string` | **Required** | Storage file ID. |
| `transformations` | `ImageTransformOptions` | `undefined` | Image resizing, cropping, and format options. |
| `fallbackSrc` | `string` | `undefined` | Fallback image URL rendered on load failure. |
| `loadingPlaceholder` | `React.ReactNode` | `undefined` | Custom skeleton or spinner while image loads. |
| `...imgProps` | `React.ImgHTMLAttributes` | - | Standard HTML `<img>` attributes (`alt`, `className`, `style`, `onLoad`). |

### Example

```tsx
import React from "react";
import { AppwriteImage } from "@repo/react-appwrite";

export function UserAvatar({ avatarId }: { avatarId: string }) {
  return (
    <AppwriteImage
      bucketId="avatars"
      fileId={avatarId}
      transformations={{
        width: 150,
        height: 150,
        quality: 85,
        borderRadius: 75,
        output: "webp",
      }}
      fallbackSrc="/default-user.png"
      loadingPlaceholder={<div className="avatar-skeleton" />}
      alt="User Profile"
    />
  );
}
```

---

## 4. `useFileDownload()`

Secure browser file download trigger.

```tsx
import { useFileDownload } from "@repo/react-appwrite";

const { downloadFile, isDownloading } = useFileDownload();

const handleDownload = async () => {
  await downloadFile("invoices_bucket", "inv_2026_08.pdf", "Invoice-August-2026.pdf");
};
```
