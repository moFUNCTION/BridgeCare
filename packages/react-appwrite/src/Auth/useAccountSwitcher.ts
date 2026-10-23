import { useState, useCallback, useMemo } from "react";
import { useAppwrite } from "../Provider/useAppwrite";
import type { SavedAccount } from "../types";

export function useAccountSwitcher() {
  const { setSessionSecret, activeSessionSecret, config } = useAppwrite();
  const storageKey = `${config.storageKeyPrefix || "appwrite"}:saved_accounts`;

  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const item = localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  });

  const addAccount = useCallback(
    (account: Omit<SavedAccount, "lastActive"> & { lastActive?: number }) => {
      setSavedAccounts((prev) => {
        const existingIndex = prev.findIndex((a) => a.userId === account.userId);
        const newAccount: SavedAccount = {
          ...account,
          lastActive: account.lastActive || Date.now(),
        };

        let updated: SavedAccount[];
        if (existingIndex >= 0) {
          updated = [...prev];
          updated[existingIndex] = newAccount;
        } else {
          updated = [...prev, newAccount];
        }

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
    },
    [storageKey]
  );

  const removeAccount = useCallback(
    (userId: string) => {
      setSavedAccounts((prev) => {
        const updated = prev.filter((a) => a.userId !== userId);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
    },
    [storageKey]
  );

  const switchAccount = useCallback(
    (userId: string): boolean => {
      const target = savedAccounts.find((a) => a.userId === userId);
      if (!target || !target.sessionSecret) {
        return false;
      }

      setSessionSecret(target.sessionSecret);
      // Update last active timestamp
      addAccount({ ...target, lastActive: Date.now() });
      return true;
    },
    [savedAccounts, setSessionSecret, addAccount]
  );

  const clearAllAccounts = useCallback(() => {
    setSavedAccounts([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    }
  }, [storageKey]);

  const currentAccount = useMemo(() => {
    return savedAccounts.find((a) => a.sessionSecret === activeSessionSecret) || null;
  }, [savedAccounts, activeSessionSecret]);

  return useMemo(
    () => ({
      savedAccounts,
      currentAccount,
      switchAccount,
      addAccount,
      removeAccount,
      clearAllAccounts,
    }),
    [
      savedAccounts,
      currentAccount,
      switchAccount,
      addAccount,
      removeAccount,
      clearAllAccounts,
    ]
  );
}
