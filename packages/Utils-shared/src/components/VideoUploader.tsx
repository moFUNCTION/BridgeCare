import type React from "react";
import { useRef, useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FaCloudUploadAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import type { Locale } from "../locale";
import { useComponentTranslations } from "./translations";

export interface VideoUploaderProps {
  onChange?: (file: File | null) => void;
  value?: File | string | null;
  maxSizeMB?: number;
  /** Optional: call when validation fails (e.g. to show toaster) */
  onError?: (message: string) => void;
  /** Language for labels (default: "en"). */
  lang?: Locale | null;
}

export function VideoUploader({
  onChange,
  value,
  maxSizeMB = 500,
  onError,
  lang,
}: VideoUploaderProps): React.ReactElement {
  const t = useComponentTranslations(lang);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

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

    if (!file.type.startsWith("video/")) {
      onError?.(t.videoRequired);
      return;
    }

    if (file.size / 1024 / 1024 > maxSizeMB) {
      onError?.(t.videoSize(maxSizeMB));
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange?.(file);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    handleFile(e.target.files?.[0]);
  };

  const removeVideo = (): void => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onChange?.(null);
  };

  return (
    <Stack gap="3" align="center" w="100%">
      {!preview ? (
        <Flex
          w="100%"
          h="200px"
          border="2px dashed"
          borderColor="blue.300"
          borderRadius="2xl"
          align="center"
          justify="center"
          direction="column"
          bg="blue.50"
          _hover={{ bg: "blue.100" }}
          cursor="pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          transition="all 0.2s ease"
        >
          <Icon as={FaCloudUploadAlt} boxSize={10} color="blue.500" />
          <Text fontSize="md" color="gray.600" mt="2">
            {t.dragVideo}
          </Text>
          <Input
            type="file"
            accept="video/*"
            ref={fileInputRef}
            onChange={handleSelect}
            display="none"
          />
        </Flex>
      ) : (
        <Box w="100%" borderWidth="1px" borderRadius="xl" overflow="hidden">
          <video src={preview} controls style={{ width: "100%", maxHeight: 300 }} />
          <Flex justify="space-between" align="center" p="2" bg="gray.50">
            <Button size="sm" colorPalette="red" onClick={removeVideo}>
              <MdDelete />
              {t.delete}
            </Button>
          </Flex>
        </Box>
      )}
    </Stack>
  );
}
