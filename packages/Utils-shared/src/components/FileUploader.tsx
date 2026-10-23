import type React from "react";
import { useMemo } from "react";
import {
  Box,
  Button,
  FileUpload,
  Flex,
  Float,
  Text,
  Image,
} from "@chakra-ui/react";
import { LuFile, LuFileImage, LuFileText, LuX } from "react-icons/lu";
import type { Locale } from "../locale";
import { resolveLocale } from "../locale";
import { useComponentTranslations } from "./translations";

function useFilePreview(file: File): string | undefined {
  return useMemo(() => {
    if (file?.type?.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, [file?.name, file?.size]);
}

interface RenderPreviewProps {
  file: File;
  t: ReturnType<typeof useComponentTranslations>;
}

function RenderPreview({ file, t }: RenderPreviewProps): React.ReactElement {
  const previewUrl = useFilePreview(file);

  if (file.type.startsWith("image/") && previewUrl) {
    return (
      <Box w="100%" h="100%" overflow="hidden" borderRadius="md">
        <Image
          src={previewUrl}
          alt={file.name}
          w="100%"
          h="100%"
          objectFit="cover"
        />
      </Box>
    );
  }

  if (file.type === "application/pdf") {
    return (
      <Box
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="center"
        w="full"
        h="full"
      >
        <LuFileText size={32} />
        <Text fontSize="xs">{t.pdf}</Text>
      </Box>
    );
  }

  if (
    file.type.includes("word") ||
    file.name.endsWith(".doc") ||
    file.name.endsWith(".docx")
  ) {
    return (
      <Box
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="center"
        w="full"
        h="full"
      >
        <LuFileText size={32} />
        <Text fontSize="xs">{t.word}</Text>
      </Box>
    );
  }

  if (
    file.type.includes("excel") ||
    file.name.endsWith(".xls") ||
    file.name.endsWith(".xlsx")
  ) {
    return (
      <Box
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="center"
        w="full"
        h="full"
      >
        <LuFile size={32} />
        <Text fontSize="xs">{t.excel}</Text>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDir="column"
      alignItems="center"
      justifyContent="center"
      w="full"
      h="full"
    >
      <LuFile size={32} />
      <Text fontSize="xs">{t.file}</Text>
    </Box>
  );
}

interface FileUploadListProps {
  files: File[];
  fileSize?: number;
  t: ReturnType<typeof useComponentTranslations>;
}

function FileUploadList({ files, fileSize = 20, t }: FileUploadListProps): React.ReactElement | null {
  if (!files?.length) return null;

  return (
    <FileUpload.ItemGroup>
      <Flex
        gap="3"
        align="center"
        bgColor="bg.muted"
        p="5"
        borderRadius="lg"
        wrap="wrap"
        justifyContent="center"
      >
        {files.map((file) => (
          <FileUpload.Item
            w="auto"
            boxSize={fileSize}
            p="2"
            file={file}
            key={`${file.name}-${file.size}-${file.lastModified}`}
          >
            <RenderPreview file={file} t={t} />
            <Float placement="top-end">
              <FileUpload.ItemDeleteTrigger
                boxSize="4"
                layerStyle="fill.solid"
                colorPalette="red"
              >
                <LuX />
              </FileUpload.ItemDeleteTrigger>
            </Float>
          </FileUpload.Item>
        ))}
      </Flex>
    </FileUpload.ItemGroup>
  );
}

export interface CustomFileUploadProps {
  files?: File[];
  onChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  buttonLabel?: string;
  buttonIcon?: React.ReactNode;
  variant?: "outline" | "solid" | "ghost" | "plain" | "subtle";
  size?: "xs" | "sm" | "md" | "lg";
  showList?: boolean;
  ButtonProps?: Record<string, unknown>;
  ContainerProps?: Record<string, unknown>;
  fileSize?: number;
  /** Language for labels (default: "en"). */
  lang?: Locale | null;
}

export function CustomFileUpload({
  files = [],
  onChange,
  accept = "image/*",
  multiple = true,
  maxFiles,
  buttonLabel,
  buttonIcon = <LuFileImage />,
  variant = "outline",
  size = "sm",
  showList = true,
  ButtonProps,
  ContainerProps,
  fileSize,
  lang,
}: CustomFileUploadProps): React.ReactElement {
  const t = useComponentTranslations(lang);
  const label = buttonLabel ?? t.uploadFiles;
  return (
    <FileUpload.Root
      accept={accept}
      maxFiles={maxFiles}
      acceptedFiles={files}
      onFileChange={(e) => {
        onChange?.(e.acceptedFiles ?? []);
      }}
      {...ContainerProps}
    >
      <FileUpload.HiddenInput />
      <FileUpload.Trigger asChild>
        <Button variant={variant} size={size} {...ButtonProps}>
          {buttonIcon} {label}
        </Button>
      </FileUpload.Trigger>
      {showList && <FileUploadList fileSize={fileSize} files={files} t={t} />}
    </FileUpload.Root>
  );
}
