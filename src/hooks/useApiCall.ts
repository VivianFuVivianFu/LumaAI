import { useState, useCallback } from 'react';

interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiCallReturn<T, Args extends any[]> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook for managing API call state with loading indicators
 *
 * @example
 * const { data, loading, error, execute } = useApiCall(async (userId) => {
 *   const response = await fetch(`/api/users/${userId}`);
 *   return response.json();
 * });
 *
 * // In component
 * useEffect(() => {
 *   execute(userId);
 * }, [userId]);
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * return <UserData data={data} />;
 */
export function useApiCall<T, Args extends any[]>(
  apiFunction: (...args: Args) => Promise<T>
): UseApiCallReturn<T, Args> {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      try {
        setState({ data: null, loading: true, error: null });
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setState({ data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for parallel API calls with combined loading state
 */
export function useParallelApiCalls<T extends Record<string, any>>(
  apiCalls: { [K in keyof T]: () => Promise<T[K]> }
) {
  const [state, setState] = useState<{
    data: Partial<T>;
    loading: boolean;
    errors: Partial<Record<keyof T, string>>;
  }>({
    data: {},
    loading: false,
    errors: {},
  });

  const execute = useCallback(async () => {
    try {
      setState({ data: {}, loading: true, errors: {} });

      const results = await Promise.allSettled(
        Object.entries(apiCalls).map(([key, fn]) =>
          (fn as () => Promise<any>)().then((data) => ({ key, data }))
        )
      );

      const data: Partial<T> = {};
      const errors: Partial<Record<keyof T, string>> = {};

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          data[result.value.key as keyof T] = result.value.data;
        } else {
          errors[result.value?.key as keyof T] = result.reason?.message || 'Unknown error';
        }
      });

      setState({ data, loading: false, errors });
      return data;
    } catch (error) {
      setState({
        data: {},
        loading: false,
        errors: { _global: 'Failed to execute API calls' } as any,
      });
      return {};
    }
  }, [apiCalls]);

  return {
    ...state,
    execute,
  };
}
