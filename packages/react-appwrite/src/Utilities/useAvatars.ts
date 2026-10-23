import { useCallback, useMemo } from "react";
import { Flag, Browser, CreditCard } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";

export function useAvatars() {
  const { avatars } = useAppwrite();

  const getInitials = useCallback(
    (name?: string, width: number = 100, height: number = 100, background?: string): string => {
      return avatars.getInitials(name, width, height, background);
    },
    [avatars]
  );

  const getQR = useCallback(
    (text: string, size: number = 400, margin: number = 1, download: boolean = false): string => {
      return avatars.getQR(text, size, margin, download);
    },
    [avatars]
  );

  const getCreditCard = useCallback(
    (
      code: CreditCard | string,
      width: number = 100,
      height: number = 100,
      quality: number = 100
    ): string => {
      return avatars.getCreditCard(code as CreditCard, width, height, quality);
    },
    [avatars]
  );

  const getFavicon = useCallback(
    (url: string): string => {
      return avatars.getFavicon(url);
    },
    [avatars]
  );

  const getFlag = useCallback(
    (
      code: Flag | string,
      width: number = 100,
      height: number = 100,
      quality: number = 100
    ): string => {
      return avatars.getFlag(code as Flag, width, height, quality);
    },
    [avatars]
  );

  const getBrowser = useCallback(
    (
      code: Browser | string,
      width: number = 100,
      height: number = 100,
      quality: number = 100
    ): string => {
      return avatars.getBrowser(code as Browser, width, height, quality);
    },
    [avatars]
  );

  const getImage = useCallback(
    (url: string, width: number = 400, height: number = 400): string => {
      return avatars.getImage(url, width, height);
    },
    [avatars]
  );

  return useMemo(
    () => ({
      getInitials,
      getQR,
      getCreditCard,
      getFavicon,
      getFlag,
      getBrowser,
      getImage,
    }),
    [
      getInitials,
      getQR,
      getCreditCard,
      getFavicon,
      getFlag,
      getBrowser,
      getImage,
    ]
  );
}
