import { useState, useCallback, useMemo } from "react";
import { AuthenticatorType, type Models, AuthenticationFactor } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";

export function useMFA() {
  const { account, config } = useAppwrite();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async <T>(fn: () => Promise<T>, context: string): Promise<T> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fn();
        setIsLoading(false);
        return res;
      } catch (err: any) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsLoading(false);
        config.onError?.(err, `useMFA:${context}`);
        throw errorObj;
      }
    },
    [config]
  );

  const getFactors = useCallback(async (): Promise<Models.MfaFactors> => {
    return execute(() => account.listMfaFactors(), "getFactors");
  }, [account, execute]);

  const enableMFA = useCallback(async (): Promise<Models.User<Models.Preferences>> => {
    return execute(() => account.updateMFA(true), "enableMFA");
  }, [account, execute]);

  const disableMFA = useCallback(async (): Promise<Models.User<Models.Preferences>> => {
    return execute(() => account.updateMFA(false), "disableMFA");
  }, [account, execute]);

  const createAuthenticator = useCallback(
    async (type: AuthenticatorType = AuthenticatorType.Totp): Promise<Models.MfaType> => {
      return execute(() => account.createMfaAuthenticator(type), "createAuthenticator");
    },
    [account, execute]
  );

  const verifyAuthenticator = useCallback(
    async (
      type: AuthenticatorType,
      otp: string
    ): Promise<Models.User<Models.Preferences>> => {
      return execute(
        () => account.updateMfaAuthenticator(type, otp),
        "verifyAuthenticator"
      );
    },
    [account, execute]
  );

  const deleteAuthenticator = useCallback(
    async (type: AuthenticatorType): Promise<void> => {
      return execute(async () => {
        await account.deleteMfaAuthenticator(type);
      }, "deleteAuthenticator");
    },
    [account, execute]
  );

  const challengeMFA = useCallback(
    async (factor: AuthenticationFactor): Promise<Models.MfaChallenge> => {
      return execute(() => account.createMfaChallenge(factor), "challengeMFA");
    },
    [account, execute]
  );

  const completeChallenge = useCallback(
    async (challengeId: string, otp: string): Promise<void> => {
      return execute(async () => {
        await account.updateMfaChallenge(challengeId, otp);
      }, "completeChallenge");
    },
    [account, execute]
  );

  const createRecoveryCodes = useCallback(async (): Promise<Models.MfaRecoveryCodes> => {
    return execute(() => account.createMfaRecoveryCodes(), "createRecoveryCodes");
  }, [account, execute]);

  const getRecoveryCodes = useCallback(async (): Promise<Models.MfaRecoveryCodes> => {
    return execute(() => account.getMfaRecoveryCodes(), "getRecoveryCodes");
  }, [account, execute]);

  return useMemo(
    () => ({
      getFactors,
      enableMFA,
      disableMFA,
      createAuthenticator,
      verifyAuthenticator,
      deleteAuthenticator,
      challengeMFA,
      completeChallenge,
      createRecoveryCodes,
      getRecoveryCodes,
      isLoading,
      error,
    }),
    [
      getFactors,
      enableMFA,
      disableMFA,
      createAuthenticator,
      verifyAuthenticator,
      deleteAuthenticator,
      challengeMFA,
      completeChallenge,
      createRecoveryCodes,
      getRecoveryCodes,
      isLoading,
      error,
    ]
  );
}
