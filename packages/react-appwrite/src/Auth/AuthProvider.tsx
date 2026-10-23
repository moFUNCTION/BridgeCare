import React, { createContext, useContext, useMemo } from "react";
import type { Models } from "appwrite";
import { useUser } from "./useUser";
import { useAuthActions } from "./useAuthActions";
import type { AuthProviderProps, UseAuthReturn } from "../types";

export const AuthContext = createContext<UseAuthReturn<any> | null>(null);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    user,
    profile,
    isLoading,
    error: userError,
    isAuthenticated,
    refresh,
    updatePrefs,
    updateProfile,
  } = useUser({ standalone: true });

  const {
    loginWithEmail,
    register,
    createUserWithEmail,
    loginWithOAuth,
    loginWithMagicURL,
    loginWithEmailOTP,
    verifyEmailOTP,
    loginWithPhone,
    verifyPhone,
    loginWithAnonymous,
    logout,
    logoutAll,
    createRecovery,
    updateRecovery,
    createVerification,
    updateVerification,
    createPhoneVerification,
    updatePhoneVerification,
    createJWT,
    listIdentities,
    deleteIdentity,
    listLogs,
    isPending,
    error: actionError,
  } = useAuthActions();

  const value = useMemo<UseAuthReturn<any>>(() => {
    return {
      user,
      profile,
      isLoading,
      isPending,
      error: actionError || userError,
      isAuthenticated,
      loginWithEmail,
      loginWithOAuth,
      loginWithMagicURL,
      loginWithEmailOTP,
      verifyEmailOTP,
      loginWithPhone,
      verifyPhone,
      loginWithAnonymous,
      logout,
      logoutAll,
      register,
      createUserWithEmail,
      createRecovery,
      updateRecovery,
      createVerification,
      updateVerification,
      createPhoneVerification,
      updatePhoneVerification,
      createJWT,
      listIdentities,
      deleteIdentity,
      listLogs,
      updatePrefs,
      updateProfile,
      refresh,
    };
  }, [
    user,
    profile,
    isLoading,
    isPending,
    userError,
    actionError,
    isAuthenticated,
    loginWithEmail,
    loginWithOAuth,
    loginWithMagicURL,
    loginWithEmailOTP,
    verifyEmailOTP,
    loginWithPhone,
    verifyPhone,
    loginWithAnonymous,
    logout,
    logoutAll,
    register,
    createUserWithEmail,
    createRecovery,
    updateRecovery,
    createVerification,
    updateVerification,
    createPhoneVerification,
    updatePhoneVerification,
    createJWT,
    listIdentities,
    deleteIdentity,
    listLogs,
    updatePrefs,
    updateProfile,
    refresh,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access Appwrite auth state and methods from AuthProvider.
 *
 * @example
 * const { user, register, loginWithEmail, logout } = useAuth();
 *
 * await register("jane@example.com", "Secret123!", "Jane Doe");
 */
export function useAuth<
  TPreferences extends Models.Preferences = Models.Preferences,
>(): UseAuthReturn<TPreferences> {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider. Wrap your component tree with <AuthProvider>."
    );
  }
  return context as UseAuthReturn<TPreferences>;
}

/**
 * Alias for `useAuth` for naming parity with `useFirebaseAuth` in `@repo/react-fire`.
 */
export const useAppwriteAuth = useAuth;
