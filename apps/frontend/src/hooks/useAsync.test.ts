import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsync, useFetch } from './useAsync';

describe('useAsync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have initial loading state as false', () => {
      const asyncFn = vi.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe('execute', () => {
    it('should set loading state during execution', async () => {
      vi.useRealTimers();

      let resolvePromise: (value: string) => void;
      const asyncFn = vi.fn().mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolvePromise = resolve;
          })
      );
      const { result } = renderHook(() => useAsync(asyncFn));

      // Start execution
      let execPromise: Promise<unknown>;
      act(() => {
        execPromise = result.current.execute();
      });

      // Check loading state
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!('data');
        await execPromise!;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe('data');
    });

    it('should return data on successful execution', async () => {
      const asyncFn = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual({ id: 1, name: 'Test' });
      expect(result.current.error).toBe(null);
    });

    it('should set error on failure', async () => {
      const error = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(error);
      expect(result.current.isLoading).toBe(false);
    });

    it('should pass arguments to async function', async () => {
      const asyncFn = vi.fn().mockResolvedValue('result');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute('arg1', 'arg2');
      });

      expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('race condition handling', () => {
    it('should ignore stale responses (race condition)', async () => {
      vi.useRealTimers(); // Need real timers for this test

      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });

      let callCount = 0;
      const asyncFn = vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? firstPromise : secondPromise;
      });

      const { result } = renderHook(() => useAsync(asyncFn));

      // Start first request
      let firstExec: Promise<unknown>;
      act(() => {
        firstExec = result.current.execute();
      });

      // Start second request before first completes
      let secondExec: Promise<unknown>;
      act(() => {
        secondExec = result.current.execute();
      });

      // Resolve second request first (faster response)
      await act(async () => {
        resolveSecond!('second');
        await secondExec!;
      });

      expect(result.current.data).toBe('second');

      // Resolve first request later (stale response)
      await act(async () => {
        resolveFirst!('first');
        await firstExec!;
      });

      // Data should still be 'second', not 'first'
      expect(result.current.data).toBe('second');
    });

    it('should handle rapid successive calls correctly', async () => {
      vi.useRealTimers();

      let callCount = 0;
      const asyncFn = vi.fn().mockImplementation(async () => {
        callCount++;
        const currentCall = callCount;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return `result-${currentCall}`;
      });

      const { result } = renderHook(() => useAsync(asyncFn));

      // Fire 5 rapid calls
      const promises: Promise<unknown>[] = [];
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          promises.push(result.current.execute());
        });
      }

      await act(async () => {
        await Promise.all(promises);
      });

      // Should only have the last result
      expect(result.current.data).toBe('result-5');
    });
  });

  describe('mounted state tracking', () => {
    it('should not update state after unmount', async () => {
      vi.useRealTimers();

      let resolvePromise: (value: string) => void;
      const asyncFn = vi.fn().mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { result, unmount } = renderHook(() => useAsync(asyncFn));

      // Start execution
      let execPromise: Promise<unknown>;
      act(() => {
        execPromise = result.current.execute();
      });

      // Unmount before completion
      unmount();

      // Resolve after unmount
      await act(async () => {
        resolvePromise!('data');
        await execPromise!;
      });

      // Should not throw or cause state update warnings
      // The test passes if no errors are thrown
    });
  });

  describe('error clearing', () => {
    it('should clear error on new execution', async () => {
      const asyncFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce('success');

      const { result } = renderHook(() => useAsync(asyncFn));

      // First call fails
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBeInstanceOf(Error);

      // Second call succeeds
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe('success');
    });
  });
});

describe('useFetch', () => {
  it('should automatically execute on mount', async () => {
    const asyncFn = vi.fn().mockResolvedValue('fetched data');

    const { result } = renderHook(() => useFetch(asyncFn, []));

    await waitFor(() => {
      expect(result.current.data).toBe('fetched data');
    });

    expect(asyncFn).toHaveBeenCalledTimes(1);
  });

  it('should re-execute when dependencies change', async () => {
    const asyncFn = vi.fn().mockResolvedValue('data');
    let dep = 1;

    const { rerender } = renderHook(() => useFetch(asyncFn, [dep]));

    await waitFor(() => {
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    // Change dependency
    dep = 2;
    rerender();

    await waitFor(() => {
      expect(asyncFn).toHaveBeenCalledTimes(2);
    });
  });

  it('should provide refetch function', async () => {
    const asyncFn = vi.fn().mockResolvedValue('data');

    const { result } = renderHook(() => useFetch(asyncFn, []));

    await waitFor(() => {
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(asyncFn).toHaveBeenCalledTimes(2);
  });
});
