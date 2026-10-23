import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { ExecutionMethod, type Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import type { UseFunctionOptions } from "../types";

export interface UseAppwriteFunctionReturn<TData = any> {
  execute: (body?: string | Record<string, any>, overrideOptions?: UseFunctionOptions) => Promise<TData>;
  execution: Models.Execution | null;
  data: TData | null;
  isLoading: boolean;
  error: Error | null;
  responseStatusCode: number | null;
  duration: number | null;
}

export function useAppwriteFunction<TData = any>(
  functionId: string,
  defaultOptions: UseFunctionOptions = {}
): UseAppwriteFunctionReturn<TData> {
  const { functions, config } = useAppwrite();
  const [execution, setExecution] = useState<Models.Execution | null>(null);
  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const defaultOptionsRef = useRef(defaultOptions);
  useEffect(() => {
    defaultOptionsRef.current = defaultOptions;
  }, [defaultOptions]);

  const execute = useCallback(
    async (
      body?: string | Record<string, any>,
      overrideOptions: UseFunctionOptions = {}
    ): Promise<TData> => {
      setIsLoading(true);
      setError(null);

      const opts = { ...defaultOptionsRef.current, ...overrideOptions };
      const bodyStr = typeof body === "object" ? JSON.stringify(body) : body || "";

      try {
        const result = await functions.createExecution(
          functionId,
          bodyStr,
          opts.async || false,
          opts.xpath || "/",
          (opts.method as ExecutionMethod) || ExecutionMethod.POST,
          opts.headers
        );

        setExecution(result);

        let parsedData: any = result.responseBody;
        if (result.responseBody) {
          try {
            parsedData = JSON.parse(result.responseBody);
          } catch {
            parsedData = result.responseBody;
          }
        }

        setData(parsedData);
        setIsLoading(false);
        opts.onSuccess?.(result);

        return parsedData as TData;
      } catch (err: any) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        setError(errObj);
        setIsLoading(false);
        config.onError?.(err, `useAppwriteFunction:${functionId}`);
        opts.onError?.(errObj);
        throw errObj;
      }
    },
    [functions, functionId, config]
  );

  return useMemo(
    () => ({
      execute,
      execution,
      data,
      isLoading,
      error,
      responseStatusCode: execution ? execution.responseStatusCode : null,
      duration: execution ? execution.duration : null,
    }),
    [execute, execution, data, isLoading, error]
  );
}
