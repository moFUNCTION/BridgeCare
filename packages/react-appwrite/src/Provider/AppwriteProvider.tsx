import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  Client,
  Account,
  Databases,
  Storage,
  Functions,
  Messaging,
  Teams,
  Avatars,
  Locale,
} from "appwrite";
import { AppwriteContext } from "./AppwriteContext";
import { CacheFusionStore } from "./CacheFusionStore";
import type { AppwriteConfig, AppwriteContextValue } from "../types";

export interface AppwriteProviderProps {
  endpoint: string;
  project: string;
  databaseId?: string;
  headers?: Record<string, string>;
  onError?: (error: unknown, context: string) => void;
  storageKeyPrefix?: string;
  autoRestoreSession?: boolean;
  children: React.ReactNode;
}

export const AppwriteProvider: React.FC<AppwriteProviderProps> = ({
  endpoint,
  project,
  databaseId,
  headers,
  onError,
  storageKeyPrefix = "appwrite",
  autoRestoreSession = true,
  children,
}) => {
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [activeSessionSecret, setActiveSessionSecretState] = useState<string | null>(() => {
    if (typeof window !== "undefined" && autoRestoreSession) {
      try {
        return localStorage.getItem(`${storageKeyPrefix}:active_session`) || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [activeJWT, setActiveJWTState] = useState<string | null>(() => {
    if (typeof window !== "undefined" && autoRestoreSession) {
      try {
        return localStorage.getItem(`${storageKeyPrefix}:active_jwt`) || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Initialize Client and all services stably
  const { client, account, databases, storage, functions, messaging, teams, avatars, locale } =
    useMemo(() => {
      const c = new Client();
      c.setEndpoint(endpoint).setProject(project);

      if (headers) {
        Object.entries(headers).forEach(([k, v]) => {
          c.headers[k] = v;
        });
      }

      return {
        client: c,
        account: new Account(c),
        databases: new Databases(c),
        storage: new Storage(c),
        functions: new Functions(c),
        messaging: new Messaging(c),
        teams: new Teams(c),
        avatars: new Avatars(c),
        locale: new Locale(c),
      };
    }, [endpoint, project, headers]);

  // Global cache fusion instance
  const cacheFusion = useMemo(() => new CacheFusionStore(), []);

  const setSessionSecret = useCallback(
    (secret: string | null) => {
      setActiveSessionSecretState(secret);
      if (typeof window !== "undefined") {
        try {
          const key = `${storageKeyPrefix}:active_session`;
          if (secret) {
            localStorage.setItem(key, secret);
            client.setSession(secret);
          } else {
            localStorage.removeItem(key);
            client.setSession("");
          }
        } catch (e) {
          onErrorRef.current?.(e, "setSessionSecret");
        }
      }
    },
    [client, storageKeyPrefix]
  );

  const setJWT = useCallback(
    (jwt: string | null) => {
      setActiveJWTState(jwt);
      if (typeof window !== "undefined") {
        try {
          const key = `${storageKeyPrefix}:active_jwt`;
          if (jwt) {
            localStorage.setItem(key, jwt);
            client.setJWT(jwt);
          } else {
            localStorage.removeItem(key);
            client.setJWT("");
          }
        } catch (e) {
          onErrorRef.current?.(e, "setJWT");
        }
      }
    },
    [client, storageKeyPrefix]
  );

  // Restore initial session secret on client if present
  useEffect(() => {
    if (activeSessionSecret && client) {
      try {
        client.setSession(activeSessionSecret);
      } catch (e) {
        onErrorRef.current?.(e, "restoreSession");
      }
    }
  }, [activeSessionSecret, client]);

  // Restore initial JWT on client if present
  useEffect(() => {
    if (activeJWT && client) {
      try {
        client.setJWT(activeJWT);
      } catch (e) {
        onErrorRef.current?.(e, "restoreJWT");
      }
    }
  }, [activeJWT, client]);

  // Global network status tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const config: AppwriteConfig = useMemo(
    () => ({
      endpoint,
      project,
      databaseId,
      headers,
      onError: (err, ctx) => onErrorRef.current?.(err, ctx),
      storageKeyPrefix,
      autoRestoreSession,
    }),
    [endpoint, project, databaseId, headers, storageKeyPrefix, autoRestoreSession]
  );

  const contextValue: AppwriteContextValue = useMemo(
    () => ({
      client,
      account,
      databases,
      storage,
      functions,
      messaging,
      teams,
      avatars,
      locale,
      cacheFusion,
      config,
      isConnected,
      activeSessionSecret,
      setSessionSecret,
      activeJWT,
      setJWT,
    }),
    [
      client,
      account,
      databases,
      storage,
      functions,
      messaging,
      teams,
      avatars,
      locale,
      cacheFusion,
      config,
      isConnected,
      activeSessionSecret,
      setSessionSecret,
      activeJWT,
      setJWT,
    ]
  );

  return <AppwriteContext.Provider value={contextValue}>{children}</AppwriteContext.Provider>;
};
