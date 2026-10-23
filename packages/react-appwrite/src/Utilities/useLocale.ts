import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";

export function useLocale() {
  const { locale, config } = useAppwrite();
  const [userLocale, setUserLocale] = useState<Models.Locale | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  const fetchLocale = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const l = await locale.get();
      if (isMountedRef.current) {
        setUserLocale(l);
        setLoading(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setLoading(false);
        config.onError?.(err, "useLocale:fetchLocale");
      }
    }
  }, [locale, config]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLocale();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchLocale]);

  const listCountries = useCallback(async (): Promise<Models.CountryList> => {
    return locale.listCountries();
  }, [locale]);

  const listEUCountries = useCallback(async (): Promise<Models.CountryList> => {
    return locale.listCountriesEU();
  }, [locale]);

  const listCountriesPhones = useCallback(async (): Promise<Models.PhoneList> => {
    return locale.listCountriesPhones();
  }, [locale]);

  const listCurrencies = useCallback(async (): Promise<Models.CurrencyList> => {
    return locale.listCurrencies();
  }, [locale]);

  const listLanguages = useCallback(async (): Promise<Models.LanguageList> => {
    return locale.listLanguages();
  }, [locale]);

  return useMemo(
    () => ({
      locale: userLocale,
      loading,
      error,
      listCountries,
      listEUCountries,
      listCountriesPhones,
      listCurrencies,
      listLanguages,
      refetch: fetchLocale,
    }),
    [
      userLocale,
      loading,
      error,
      listCountries,
      listEUCountries,
      listCountriesPhones,
      listCurrencies,
      listLanguages,
      fetchLocale,
    ]
  );
}
