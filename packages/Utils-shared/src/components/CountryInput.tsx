import {
  Flex,
  useDisclosure,
  Image,
  Badge,
  IconButton,
  Heading,
  Skeleton,
  Input,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useRef, useCallback } from "react";
import { SearchField } from "./SearchField";
import { useInView } from "framer-motion";
import { CiPhone } from "react-icons/ci";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useUserCountry } from "@repo/hooks-shared";

import type { Country } from "@repo/data-shared";
import { countriesRepository } from "@repo/data-shared";
import type { Locale } from "../locale";
import { useComponentTranslations } from "./translations";
import {
  fetchCca3FromCountryFromIpUrl,
  resolveCountryFromIpUrl,
} from "./countryFromIp";

interface CountryRecord {
  flags?: { svg?: string };
  name?: {
    common?: string;
    nativeName?: Record<string, { common: string }>;
  };
  idd?: { root: string; suffixes: string[] };
  capital?: string[];
}

/** Full country from JSON + computed fields for search/display. */
export type CountryWithDisplay = Country & {
  commonCapital: string;
  displayName?: string;
};

type CountryItemProps = CountryWithDisplay & {
  onSelect: () => void;
};

function getDisplayProps(raw: Country) {
  const r = raw as unknown as CountryRecord;
  const flags = r.flags ?? {};
  const name = r.name ?? {};
  const common = name.common ?? "";
  const nativeNameMap = name.nativeName ?? {};
  const ara = nativeNameMap.ara ?? Object.values(nativeNameMap)[0];
  const idd = r.idd ?? { root: "", suffixes: [] as string[] };
  return { flags, common, nativeName: ara ? { ara } : undefined, idd };
}

const CountryItem: React.FC<CountryItemProps> = (raw) => {
  const { flags, common, nativeName, idd } = getDisplayProps(raw);
  const svg = flags?.svg ?? "";
  const { root, suffixes } = idd;
  const countryName = raw.displayName ?? nativeName?.ara?.common ?? common;
  const { onSelect } = raw;
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
      onClick={onSelect}
      _hover={{
        bgColor: "blue.muted",
      }}
      cursor="pointer"
    >
      <Image
        loading="lazy"
        decoding="async"
        borderRadius="md"
        src={svg}
        w="100%"
        maxW="60px"
      />
      <Flex gap="3">
        <Badge textAlign="center" justifyContent="center" colorPalette="blue">
          {countryName}
        </Badge>
        <Badge
          textAlign="center"
          justifyContent="center"
          w="100px"
          colorPalette="green"
        >
          <CiPhone />
          {root}
          {suffixes?.[0] ?? ""}
        </Badge>
      </Flex>
    </Flex>
  );
};

export interface CountryInputProps {
  InputProps?: React.ComponentProps<typeof Input>;
  selectedCountry: any;
  onSelectCountry: (country: Country | null) => void;
  /** Language for placeholder and country names (en = English names, ar = Arabic names). */
  lang?: Locale | null;
  withSearchButtonIcon?: boolean;
  /**
   * When true (default), fetches user's country via geolocation and sets it as default when none is selected.
   * When false, no geolocation is used and the country will not be auto-set.
   */
  getWithGeoLocation?: boolean;
  /**
   * When true, resolves default country (cca3) once from your `getCountryFromIp` HTTP function when nothing is selected.
   * Ignored when `getWithGeoLocation` is true (browser geo takes precedence). Default false so not every screen opts in.
   */
  defaultCountryFromIp?: boolean;
  /**
   * Full URL for the Cloud Function, e.g. `https://REGION-PROJECT.cloudfunctions.net/getCountryFromIp`.
   * If omitted, uses `resolveCountryFromIpUrl()` (Vite `VITE_FIREBASE_FUNCTIONS_URL` or dev `/getCountryFromIp`).
   */
  getCountryFromIpUrl?: string;
  /**
   * Optional custom fetcher function (e.g. using Firebase callables).
   * If provided, overrides getCountryFromIpUrl.
   */
  getCountryFromIpFetcher?: () => Promise<{ data: { cca3: string | null } }>;
}

function addDisplayFields(
  raw: Country,
  lang?: Locale | null,
): CountryWithDisplay {
  const r = raw as unknown as CountryRecord;
  const name = r.name ?? {};
  const common = name.common ?? "";
  const nativeNameMap = name.nativeName ?? {};
  const ara = nativeNameMap.ara ?? Object.values(nativeNameMap)[0];
  const araCommon = ara?.common;
  const capitalArr = r.capital ?? [];
  const commonCapital = [common, araCommon, capitalArr[0]]
    .filter(Boolean)
    .join(" - ");
  const displayName = lang === "ar" ? (araCommon ?? common) : common;

  return { ...raw, commonCapital, displayName };
}

export const CountryInput: React.FC<CountryInputProps> = ({
  InputProps,
  selectedCountry,
  onSelectCountry,
  lang,
  withSearchButtonIcon = true,
  getWithGeoLocation = true,
  defaultCountryFromIp = false,
  getCountryFromIpUrl,
  getCountryFromIpFetcher,
}) => {
  const { country, loading } = useUserCountry({
    isStored: !!selectedCountry || !getWithGeoLocation,
  });
  const t = useComponentTranslations(lang);
  const hasUserCleared = useRef(false);
  const selectedCountryRef = useRef(selectedCountry);
  selectedCountryRef.current = selectedCountry;

  const data = useMemo<CountryWithDisplay[]>(() => {
    const all = countriesRepository.getAll();
    return all.map((c) => addDisplayFields(c, lang));
  }, [lang]);

  const handleSelectCountry = useCallback(
    (c: Country | null) => {
      if (c === null) hasUserCleared.current = true;
      onSelectCountry(c);
    },
    [onSelectCountry],
  );

  useEffect(() => {
    if (
      !getWithGeoLocation ||
      hasUserCleared.current ||
      !country ||
      selectedCountry ||
      loading
    )
      return;
    const selected = data.find(
      (item) => (item as unknown as CountryRecord).name?.common === country.name,
    );
    if (selected) {
      onSelectCountry(selected);
    }
  }, [
    getWithGeoLocation,
    country?.name,
    loading,
    selectedCountry?.cca3,
    data,
    onSelectCountry,
  ]);

  useEffect(() => {
    if (
      !defaultCountryFromIp ||
      getWithGeoLocation ||
      hasUserCleared.current ||
      selectedCountry
    ) {
      return;
    }
    let cancelled = false;

    if (getCountryFromIpFetcher) {
      void getCountryFromIpFetcher().then((res) => {
        if (cancelled) return;
        if (selectedCountryRef.current) return;
        const cca3 = res.data.cca3;
        if (!cca3) return;
        const c = countriesRepository.getByCode(cca3);
        if (!c) return;
        onSelectCountry(c);
      });
    } else {
      const url = resolveCountryFromIpUrl(getCountryFromIpUrl ?? null);
      if (!url) return;
      void fetchCca3FromCountryFromIpUrl(url).then((cca3) => {
        if (cancelled) return;
        if (selectedCountryRef.current) return;
        if (!cca3) return;
        const c = countriesRepository.getByCode(cca3);
        if (!c) return;
        onSelectCountry(c);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [
    defaultCountryFromIp,
    getWithGeoLocation,
    getCountryFromIpUrl,
    getCountryFromIpFetcher,
    selectedCountry,
    onSelectCountry,
  ]);

  const { onOpen, onClose, open: isOpen } = useDisclosure();

  if (getWithGeoLocation && loading) {
    return <Skeleton w="100%" flexShrink="1" h="50px" />;
  }

  return (
    <>
      {selectedCountry ? (
        <Flex
          gap="3"
          alignItems="center"
          p="2"
          w="100%"
          borderWidth="1px"
          borderColor="fg.subtle"
          borderRadius="sm"
          h="100%"
        >
          <Image
            borderRadius="full"
            src={(selectedCountry as CountryRecord).flags?.svg}
            w="30px"
            aspectRatio={1 / 1}
          />
          <Heading size="sm">
            {lang === "ar"
              ? ((selectedCountry as CountryRecord).name?.nativeName?.ara
                  ?.common ?? (selectedCountry as CountryRecord).name?.common)
              : (selectedCountry as CountryRecord).name?.common}
          </Heading>
          <IconButton
            type="button"
            {...(lang === "ar" ? { mr: "auto" } : { ml: "auto" })}
            onClick={() => handleSelectCountry(null)}
            variant="ghost"
            colorPalette="red"
            size="sm"
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
          SearchItem={CountryItem}
          placeholder={t.countryPlaceholder}
          searchField="commonCapital"
          onSelect={(item) => handleSelectCountry(item)}
          InputProps={InputProps}
        />
      )}
    </>
  );
};
