import { useState, useEffect, useCallback, useRef, useMemo, useContext } from "react";
import type { Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import { authEvents } from "./authEvents";
import { AuthContext } from "./AuthProvider";

export interface UseUserOptions {
  standalone?: boolean;
}

export interface UseUserReturn<
  TPreferences extends Models.Preferences = Models.Preferences,
> {
  user: Models.User<TPreferences> | null;
  profile: TPreferences | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  refresh: () => Promise<Models.User<TPreferences> | null>;
  updatePrefs: (prefs: TPreferences) => Promise<Models.User<TPreferences>>;
  updateProfile: (data: Partial<TPreferences>) => Promise<Models.User<TPreferences>>;
}

export function useUser<
  TPreferences extends Models.Preferences = Models.Preferences,
>(_options: UseUserOptions = {}): UseUserReturn<TPreferences> {
  const authContext = useContext(AuthContext);
  if (!_options.standalone && authContext) {
    return {
      user: authContext.user,
      profile: authContext.profile,
      isLoading: authContext.isLoading,
      error: authContext.error,
      isAuthenticated: authContext.isAuthenticated,
      refresh: authContext.refresh,
      updatePrefs: authContext.updatePrefs,
      updateProfile: (authContext.updateProfile || (async () => authContext.user!)) as any,
    };
  }

  const { account, client, activeSessionSecret } = useAppwrite();
  const [user, setUser] = useState<Models.User<TPreferences> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  const fetchUser = useCallback(
    async (isBackground = false): Promise<Models.User<TPreferences> | null> => {
      if (!isBackground) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const currentUser = await account.get<TPreferences>();
        if (isMountedRef.current) {
          setUser((prev) => {
            if (
              prev &&
              currentUser &&
              prev.$id === currentUser.$id &&
              prev.email === currentUser.email &&
              prev.emailVerification === currentUser.emailVerification &&
              prev.status === currentUser.status &&
              JSON.stringify(prev.prefs) === JSON.stringify(currentUser.prefs)
            ) {
              return prev;
            }
            return currentUser;
          });
          setIsLoading(false);
        }
        return currentUser;
      } catch (err: any) {
        if (isMountedRef.current) {
          setUser(null);
          // 401 unauthenticated is a normal state, not a hard error
          if (err?.code !== 401) {
            setError(err instanceof Error ? err : new Error(String(err)));
          } else {
            setError(null);
          }
          setIsLoading(false);
        }
        return null;
      }
    },
    [account]
  );

  const updatePrefs = useCallback(
    async (prefs: TPreferences): Promise<Models.User<TPreferences>> => {
      const updatedUser = await account.updatePrefs<TPreferences>(prefs);
      if (isMountedRef.current) {
        setUser(updatedUser);
      }
      authEvents.emit("USER_UPDATED", { user: updatedUser });
      return updatedUser;
    },
    [account]
  );

  const updateProfile = useCallback(
    async (data: Partial<TPreferences>): Promise<Models.User<TPreferences>> => {
      const currentPrefs = (user?.prefs || {}) as TPreferences;
      const mergedPrefs = { ...currentPrefs, ...data } as TPreferences;
      return await updatePrefs(mergedPrefs);
    },
    [user, updatePrefs]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchUser(false);

    // 1. Subscribe to global client-side auth events
    const unsubscribeAuthEvents = authEvents.subscribe((event) => {
      if (event.type === "SIGNED_OUT") {
        if (isMountedRef.current) {
          setUser(null);
          setIsLoading(false);
          setError(null);
        }
      } else if (event.type === "SIGNED_IN" && event.user) {
        if (isMountedRef.current) {
          setUser(event.user as Models.User<TPreferences>);
          setIsLoading(false);
          setError(null);
        }
      } else {
        fetchUser(true);
      }
    });

    // 2. Subscribe to Appwrite Realtime account events
    let unsubscribeRealtime: (() => void) | undefined;
    try {
      unsubscribeRealtime = client.subscribe("account", () => {
        fetchUser(true);
      });
    } catch {
      // Ignore if realtime is unavailable
    }

    return () => {
      isMountedRef.current = false;
      unsubscribeAuthEvents();
      unsubscribeRealtime?.();
    };
  }, [fetchUser, client, activeSessionSecret]);

  return useMemo(
    () => ({
      user,
      profile: user?.prefs || null,
      isLoading,
      error,
      isAuthenticated: !!user,
      refresh: fetchUser,
      updatePrefs,
      updateProfile,
    }),
    [user, isLoading, error, fetchUser, updatePrefs, updateProfile]
  );
}
