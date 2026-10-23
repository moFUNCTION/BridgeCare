import {
  Flex,
  useDisclosure,
  Badge,
  IconButton,
  Heading,
  Input,
  InputGroupProps,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { SearchField } from "./SearchField";
import { RiDeleteBin6Line } from "react-icons/ri";
import { languagesRepository } from "@repo/data-shared";
import type { Language } from "@repo/data-shared";
import type { Locale } from "../locale";
import type { LanguageLocale } from "@repo/data-shared";
import { useComponentTranslations } from "./translations";

/** Language with display fields for search and localized display. */
export type LanguageWithDisplay = Language & {
  displayName: string;
  searchText: string;
};

type LanguageItemProps = LanguageWithDisplay & {
  onSelect: () => void;
};

const LanguageItem: React.FC<LanguageItemProps> = ({
  displayName,
  onSelect,
}) => {
  return (
    <Flex
      h="65px"
      w="100%"
      borderRadius="lg"
      p="3"
      borderWidth="1px"
      justifyContent="space-between"
      alignItems="center"
      onClick={onSelect}
      _hover={{
        bgColor: "gray.100",
      }}
      cursor="pointer"
    >
      <Heading textAlign="center" colorPalette="blue" fontSize="md">
        {displayName}
      </Heading>
    </Flex>
  );
};

export interface LanguageInputProps {
  InputProps?: React.ComponentProps<typeof Input>;
  selectedLanguage: Language | null;
  onSelectLanguage: (language: Language | null) => void;
  /** Language for placeholder and language names (ar | en). */
  lang?: Locale | null;
  withSearchButtonIcon?: boolean;
  InputContainerProps?: InputGroupProps;
}

function addDisplayFields(
  lang: Language,
  locale: LanguageLocale,
): LanguageWithDisplay {
  const displayName =
    languagesRepository.getTranslation(lang.code, locale) ?? lang.name;
  const enName =
    languagesRepository.getTranslation(lang.code, "en") ?? lang.name;
  const arName =
    languagesRepository.getTranslation(lang.code, "ar") ?? lang.name;
  const searchText = `${enName} ${arName}`;

  return { ...lang, displayName, searchText };
}

export const LanguageInput: React.FC<LanguageInputProps> = ({
  InputProps,
  InputContainerProps,
  selectedLanguage,
  onSelectLanguage,
  lang,
  withSearchButtonIcon = true,
}) => {
  const t = useComponentTranslations(lang);
  const locale: LanguageLocale = lang === "ar" || lang === "en" ? lang : "en";

  const data = useMemo<LanguageWithDisplay[]>(() => {
    const all = languagesRepository.getAll();
    return all.map((l) => addDisplayFields(l, locale));
  }, [locale]);

  const { onOpen, onClose, open: isOpen } = useDisclosure();

  return (
    <>
      {selectedLanguage ? (
        <Flex
          gap="3"
          alignItems="center"
          px="4"
          py="1"
          h="100%"
          w="100%"
          borderWidth="1px"
          borderColor="fg.subtle"
          borderRadius="md"
        >
          <Heading size="sm">
            {languagesRepository.getTranslation(
              selectedLanguage.code,
              locale,
            ) ?? selectedLanguage.name}
          </Heading>
          <IconButton
            {...(locale === "ar" ? { mr: "auto" } : { ml: "auto" })}
            onClick={() => onSelectLanguage(null)}
            variant="ghost"
            colorPalette="red"
            size="sm"
          >
            <RiDeleteBin6Line />
          </IconButton>
        </Flex>
      ) : (
        <SearchField
          InputContainerProps={InputContainerProps}
          withSearchButtonIcon={withSearchButtonIcon}
          onOpen={onOpen}
          onClose={onClose}
          isOpen={isOpen}
          lang={lang}
          itemsPerPageCount={6}
          Data={data}
          SearchItem={LanguageItem}
          placeholder={t.languagePlaceholder}
          searchField="searchText"
          onSelect={(item) => onSelectLanguage(item)}
          InputProps={InputProps}
        />
      )}
    </>
  );
};
