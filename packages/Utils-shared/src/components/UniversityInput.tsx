import {
  Flex,
  useDisclosure,
  Badge,
  IconButton,
  Heading,
  Input,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useRef } from "react";
import { SearchField } from "./SearchField";
import { useInView } from "framer-motion";
import { RiDeleteBin6Line } from "react-icons/ri";
import {
  universitiesRepository,
  type WorldUniversity,
} from "@repo/data-shared";
import type { Locale } from "../locale";
import { useComponentTranslations } from "./translations";

type WorldUniversityRecord = WorldUniversity & {
  name?: string;
  country?: string;
  alpha_two_code?: string;
};

/** University with computed fields for search/display. */
export type UniversityWithDisplay = WorldUniversityRecord & {
  searchDisplay: string;
};

export type UniversityValue = {
  name: string;
  country: string;
  alpha_two_code: string;
};

function toUniversityValue(uni: WorldUniversityRecord): UniversityValue {
  return {
    name: uni.name ?? "",
    country: uni.country ?? "",
    alpha_two_code: uni.alpha_two_code ?? "",
  };
}

type UniversityItemProps = UniversityWithDisplay & {
  onSelect: () => void;
};

const UniversityItem: React.FC<UniversityItemProps> = (raw) => {
  const { onSelect } = raw;
  const name = (raw as WorldUniversityRecord).name ?? "";
  const country = (raw as WorldUniversityRecord).country ?? "";
  const ref = useRef(null);
  const inView = useInView(ref);

  return (
    <Flex
      opacity={inView ? "1" : "0"}
      translate={inView ? "0px 0px" : "0px 100%"}
      transition="0.3s"
      ref={ref}
      w="100%"
      borderRadius="lg"
      p="3"
      borderWidth="1px"
      justifyContent="space-between"
      alignItems="center"
      onClick={onSelect}
      _hover={{ bgColor: "bg.muted" }}
      cursor="pointer"
      h="65px"
    >
      <Badge
        size="lg"
        textAlign="center"
        justifyContent="center"
        colorPalette="blue"
      >
        {name?.slice(0, 20)}...
      </Badge>
      <Badge
        size="lg"
        textAlign="center"
        justifyContent="center"
        colorPalette="gray"
        variant="subtle"
      >
        {country}
      </Badge>
    </Flex>
  );
};

function addDisplayFields(raw: WorldUniversityRecord): UniversityWithDisplay {
  const name = raw.name ?? "";
  const country = raw.country ?? "";
  const searchDisplay = [name, country].filter(Boolean).join(" - ");
  return { ...raw, searchDisplay };
}

export interface UniversityInputProps {
  selectedUniversity: any;
  onSelectUniversity: (uni: UniversityValue | null) => void;
  /** Language for placeholder (default: "en"). */
  lang?: Locale | null;
  placeholder?: string;
  withSearchButtonIcon?: boolean;
  InputProps?: React.ComponentProps<typeof Input>;
}

export const UniversityInput: React.FC<UniversityInputProps> = ({
  selectedUniversity,
  onSelectUniversity,
  lang,
  placeholder,
  withSearchButtonIcon = true,
  InputProps,
}) => {
  const t = useComponentTranslations(lang);
  const { onOpen, onClose, open: isOpen } = useDisclosure();

  const data = useMemo<UniversityWithDisplay[]>(() => {
    const all = universitiesRepository.getAll();
    return all.map((u) => addDisplayFields(u as WorldUniversityRecord));
  }, []);

  const handleSelectUniversity = useCallback(
    (uni: UniversityWithDisplay | null) => {
      if (!uni) {
        onSelectUniversity(null);
      } else {
        onSelectUniversity(toUniversityValue(uni as WorldUniversityRecord));
      }
    },
    [],
  );

  const placeholderText =
    placeholder ?? (t as any).universityPlaceholder ?? (t as any).searchPlaceholder;

  return (
    <>
      {selectedUniversity ? (
        <Flex
          gap="3"
          alignItems="center"
          px="4"
          py="2"
          w="100%"
          borderWidth="1px"
          borderColor="fg.subtle"
          borderRadius="sm"
        >
          <Heading size="sm">{selectedUniversity.name}</Heading>
          <Badge colorPalette="gray" variant="subtle" fontSize="xs">
            {selectedUniversity.country}
          </Badge>
          <IconButton
            type="button"
            {...(lang === "ar" ? { mr: "auto" } : { ml: "auto" })}
            onClick={() => handleSelectUniversity(null)}
            variant="ghost"
            colorPalette="red"
            size="sm"
            borderRadius="full"
            aria-label={t.delete}
          >
            <RiDeleteBin6Line />
          </IconButton>
        </Flex>
      ) : (
        <SearchField
          withSearchButtonIcon={withSearchButtonIcon}
          onOpen={onOpen}
          onClose={onClose}
          isOpen={isOpen}
          lang={lang}
          itemsPerPageCount={4}
          Data={data}
          SearchItem={UniversityItem}
          placeholder={placeholderText}
          searchField="searchDisplay"
          onSelect={(item) => handleSelectUniversity(item)}
          InputProps={InputProps}
        />
      )}
    </>
  );
};
