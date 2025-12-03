import { useState, useCallback, useEffect } from "react";

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      setState({ data: null, error: null, isLoading: true });

      try {
        const result = await asyncFn(...args);
        setState({ data: result, error: null, isLoading: false });
        return result;
      } catch (error) {
        setState({ data: null, error: error as Error, isLoading: false });
      }
    },
    [asyncFn]
  );

  return { ...state, execute };
}

export function useFetch<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const { execute, ...state } = useAsync(asyncFn);

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refetch: execute };
}
