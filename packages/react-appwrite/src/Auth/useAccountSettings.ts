import { useState, useCallback, useMemo } from "react";
import type { Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";

export function useAccountSettings() {
  const { account, config } = useAppwrite();
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async <T>(fn: () => Promise<T>, context: string): Promise<T> => {
      setIsUpdating(true);
      setError(null);
      try {
        const res = await fn();
        setIsUpdating(false);
        return res;
      } catch (err: any) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        setError(errObj);
        setIsUpdating(false);
        config.onError?.(err, `useAccountSettings:${context}`);
        throw errObj;
      }
    },
    [config]
  );

  const updateName = useCallback(
    async (name: string): Promise<Models.User<Models.Preferences>> => {
      return execute(() => account.updateName(name), "updateName");
    },
    [account, execute]
  );

  const updateEmail = useCallback(
    async (email: string, password: string): Promise<Models.User<Models.Preferences>> => {
      return execute(() => account.updateEmail(email, password), "updateEmail");
    },
    [account, execute]
  );

  const updatePassword = useCallback(
    async (password: string, oldPassword?: string): Promise<Models.User<Models.Preferences>> => {
      return execute(() => account.updatePassword(password, oldPassword), "updatePassword");
    },
    [account, execute]
  );

  const updatePhone = useCallback(
    async (phone: string, password: string): Promise<Models.User<Models.Preferences>> => {
      return execute(() => account.updatePhone(phone, password), "updatePhone");
    },
    [account, execute]
  );

  const updatePrefs = useCallback(
    async <T extends Models.Preferences = Models.Preferences>(
      prefs: T
    ): Promise<Models.User<T>> => {
      return execute(() => account.updatePrefs<T>(prefs), "updatePrefs");
    },
    [account, execute]
  );

  const getPrefs = useCallback(async <
    T extends Models.Preferences = Models.Preferences,
  >(): Promise<T> => {
    return execute(() => account.getPrefs<T>(), "getPrefs");
  }, [account, execute]);

  return useMemo(
    () => ({
      updateName,
      updateEmail,
      updatePassword,
      updatePhone,
      updatePrefs,
      getPrefs,
      isUpdating,
      error,
    }),
    [
      updateName,
      updateEmail,
      updatePassword,
      updatePhone,
      updatePrefs,
      getPrefs,
      isUpdating,
      error,
    ]
  );
}
