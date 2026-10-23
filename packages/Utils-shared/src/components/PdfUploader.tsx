import type React from "react";
import { useMemo, useRef } from "react";
import {
  AspectRatio,
  Box,
  Button,
  ButtonGroup,
  IconButton,
} from "@chakra-ui/react";
import { BiEdit } from "react-icons/bi";
import { GiCancel } from "react-icons/gi";
import type { Locale } from "../locale";
import { useComponentTranslations } from "./translations";

export interface PdfUploaderProps {
  pdf: File | string | null;
  onChangePdf: (file: File) => void;
  onRemovePdf: () => void;
  /** Language for labels (default: "en"). */
  lang?: Locale | null;
}

export function PdfUploader({
  pdf,
  onChangePdf,
  onRemovePdf,
  lang,
}: PdfUploaderProps): React.ReactElement {
  const t = useComponentTranslations(lang);
  const inputRef = useRef<HTMLInputElement>(null);
  const pdfSrc = useMemo(() => {
    if (!pdf) return null;
    if (pdf instanceof File) return URL.createObjectURL(pdf);
    return pdf;
  }, [pdf]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) onChangePdf(file);
    e.target.value = "";
  };

  return (
    <Box
      bgColor="orange.200"
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDir="column"
      p="10px"
      gap="10px"
      overflow="hidden"
      borderRadius="lg"
      border="2px"
      borderColor="orange"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {pdfSrc ? (
        <Box
          w="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          p="10px"
          flexDir="column"
          gap="10px"
        >
          <AspectRatio w="100%" maxW="700px" ratio={16 / 9}>
            <iframe
              style={{ borderRadius: "6px" }}
              title="PDF preview"
              loading="lazy"
              src={pdfSrc}
              allowFullScreen
            />
          </AspectRatio>
          <ButtonGroup gap="10px">
            <IconButton
              onClick={onRemovePdf}
              colorPalette="red"
              aria-label={t.removePdf}
              title={t.removePdf}
            >
              <GiCancel />
            </IconButton>
            <IconButton
              colorPalette="green"
              aria-label={t.changePdf}
              title={t.changePdf}
              onClick={() => inputRef.current?.click()}
            >
              <BiEdit />
            </IconButton>
          </ButtonGroup>
        </Box>
      ) : (
        <Button
          colorPalette="orange"
          onClick={() => inputRef.current?.click()}
        >
          {t.selectPdf}
        </Button>
      )}
    </Box>
  );
}
