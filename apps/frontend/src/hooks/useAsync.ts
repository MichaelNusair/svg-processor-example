import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type DependencyList,
} from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: unknown;
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

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect((): (() => void) => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      const currentId = ++requestIdRef.current;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const result = await asyncFn(...args);

        if (isMountedRef.current && currentId === requestIdRef.current) {
          setState({
            data: result,
            error: null,
            isLoading: false,
          });
        }

        return result;
      } catch (error) {
        if (isMountedRef.current && currentId === requestIdRef.current) {
          setState({
            data: null,
            error,
            isLoading: false,
          });
        }
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

  useEffect((): void => {
    void execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps array is provided by caller, intentionally not including execute
  }, deps);

  return { ...state, refetch: execute };
}
