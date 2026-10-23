import type React from "react";
import { useRef, useState, useEffect, useId } from "react";
import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  Stack,
  Text,
  Image,
  IconButton,
} from "@chakra-ui/react";
import type { BoxProps, ImageProps, StackProps } from "@chakra-ui/react";
import { FaCloudUploadAlt } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import type { Locale } from "../locale";
import { useComponentTranslations } from "./translations";

export interface ImageUploaderProps
  extends Omit<StackProps, "onChange" | "onError" | "lang" | "direction"> {
  direction?: any;
  onChange?: (file: File | null) => void;
  value?: File | string | null;
  maxSizeMB?: number;
  /** File input accept attribute (default: "image/*"). */
  accept?: string;
  /** Optional: call when validation fails (e.g. to show toaster) */
  onError?: (message: string) => void;
  /** Language for labels (default: "en"). */
  lang?: Locale | null;
  /** Override labels (falls back to translations when omitted). */
  labelDrag?: string;
  labelDelete?: string;
  labelEdit?: string;
  /** Dropzone height in pixels (default: 200). */
  dropzoneHeight?: number;
  /** Max width of preview image in pixels (default: 400). */
  maxPreviewWidth?: number;
  /** Object-fit for preview image (default: "contain"). */
  objectFit?: "contain" | "cover" | "fill" | "none";
  /** Color palette for dropzone and edit button (default: "green"). */
  colorPalette?: "green" | "blue" | "gray" | "red" | string;
  /** Whether to show the edit/replace button (default: true). */
  showEditButton?: boolean;
  /** Disable all interactions. */
  disabled?: boolean;
  /** Additional props for the dropzone container. */
  dropzoneProps?: BoxProps;
  /** Additional props for the preview container. */
  previewContainerProps?: BoxProps;
  /** Alt text for the preview image (default: "Preview"). */
  previewAlt?: string;
  previewImageProps?: ImageProps;
}

export function ImageUploader({
  onChange,
  value,
  maxSizeMB = 10,
  accept = "image/*",
  onError,
  lang,
  labelDrag,
  labelDelete,
  labelEdit,
  dropzoneHeight = 200,
  maxPreviewWidth = 400,
  objectFit = "contain",
  colorPalette = "green",
  showEditButton = true,
  disabled = false,
  dropzoneProps,
  previewContainerProps,
  previewAlt = "Preview",
  previewImageProps = {},
  ...stackProps
}: ImageUploaderProps): React.ReactElement {
  const t = useComponentTranslations(lang);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(null);

  const dragLabel = labelDrag ?? t.dragImage;
  const deleteLabel = labelDelete ?? t.delete;
  const editLabel = labelEdit ?? t.edit;

  useEffect(() => {
    if (value == null) {
      setPreview(null);
      return;
    }
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(value);
  }, [value]);

  const handleFile = (file: File | undefined): void => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError?.(t.imageRequired);
      return;
    }

    if (file.size / 1024 / 1024 > maxSizeMB) {
      onError?.(t.imageSize(maxSizeMB));
      return;
    }

    onChange?.(file);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    if (disabled) return;
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const removeImage = (): void => {
    setPreview(null);
    onChange?.(null);
  };

  const openFilePicker = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (!disabled) fileInputRef.current?.click();
  };

  const onDropzoneKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFilePicker();
    }
  };

  return (
    <Stack gap="3" align="center" w="100%" position="relative" {...(stackProps as any)}>
      {/*
        Always mounted + visually hidden (not display:none): some browsers block
        programmatic input.click() on display:none file inputs — fixes first pick + edit.
      */}
      <Input
        id={inputId}
        type="file"
        accept={accept}
        ref={fileInputRef}
        onChange={handleSelect}
        position="absolute"
        width="1px"
        height="1px"
        p="0"
        m="-1px"
        overflow="hidden"
        clipPath="inset(50%)"
        border="0"
        opacity={0}
        zIndex={-1}
        aria-hidden
        tabIndex={-1}
        disabled={disabled}
      />

      {!preview ? (
        <Flex
          w="100%"
          h={dropzoneHeight}
          border="2px dashed"
          borderColor={`${colorPalette}.300`}
          borderRadius="2xl"
          align="center"
          justify="center"
          flexDirection="column"
          bg={`${colorPalette}.subtle`}
          _hover={!disabled ? { bg: `${colorPalette}.muted` } : undefined}
          cursor={disabled ? "not-allowed" : "pointer"}
          onClick={openFilePicker}
          onKeyDown={onDropzoneKeyDown}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          transition="all 0.2s ease"
          opacity={disabled ? 0.6 : 1}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-controls={inputId}
          {...(dropzoneProps as any)}
        >
          <Icon
            as={FaCloudUploadAlt}
            boxSize={10}
            color={`${colorPalette}.500`}
          />
          <Text
            fontSize="md"
            color="fg.muted"
            mt="2"
            w="100%"
            px="3"
            textAlign="center"
          >
            {dragLabel}
          </Text>
        </Flex>
      ) : (
        <Box
          p="3"
          w="100%"
          borderWidth="1px"
          borderRadius="xl"
          overflow="hidden"
          display="flex"
          justifyContent="center"
          alignItems="center"
          {...previewContainerProps}
        >
          <Stack w="fit-content" pos="relative">
            <Image
              borderRadius="lg"
              src={preview}
              alt={previewAlt}
              w="100%"
              maxW={maxPreviewWidth}
              m="0 auto"
              objectFit={objectFit}
              {...previewImageProps}
            />
            <Flex
              gap="1"
              pos="absolute"
              bottom="2"
              right="1"
              justify="center"
              align="center"
            >
              <IconButton
                size="sm"
                colorPalette="red"
                onClick={removeImage}
                disabled={disabled}
                aria-label={deleteLabel}
              >
                <MdDelete />
              </IconButton>

              {showEditButton ? (
                <IconButton
                  size="sm"
                  colorPalette={colorPalette}
                  onClick={openFilePicker}
                  disabled={disabled}
                  aria-label={editLabel}
                >
                  <MdEdit />
                </IconButton>
              ) : null}
            </Flex>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
