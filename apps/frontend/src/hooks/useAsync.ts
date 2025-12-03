import { useState, useCallback, useEffect, type DependencyList } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>
): AsyncState<T> & { execute: (...args: Args) => Promise<T | undefined> } {
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
  deps: DependencyList = []
): AsyncState<T> & { refetch: () => Promise<T | undefined> } {
  const { execute, ...state } = useAsync(asyncFn);

  useEffect(() => {
    void execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refetch: execute };
}
