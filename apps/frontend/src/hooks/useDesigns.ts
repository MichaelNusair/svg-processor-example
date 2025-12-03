import { useCallback } from 'react';
import { getDesigns, getDesign, uploadSVG } from '../api';
import { useAsync, useFetch } from './useAsync';
import type { Design, DesignListItem } from '@svg-processor/shared-types';
import type { AsyncState } from './useAsync';

export function useDesignList(): AsyncState<DesignListItem[]> & {
  designs: DesignListItem[];
  refetch: () => Promise<DesignListItem[] | undefined>;
} {
  const result = useFetch(getDesigns, []);
  return { designs: result.data ?? [], ...result };
}

export function useDesign(id: string | undefined): AsyncState<Design> & {
  design: Design | null;
  refetch: () => Promise<Design | undefined>;
} {
  const fetchDesign = useCallback(async (): Promise<Design> => {
    if (!id) return Promise.reject(new Error('No ID'));
    return getDesign(id);
  }, [id]);

  const result = useFetch(fetchDesign, [id]);
  return { design: result.data ?? null, ...result };
}

export function useUploadDesign(): {
  upload: (file: File) => Promise<{ id: string; message: string } | undefined>;
  isUploading: boolean;
  error: Error | null;
  result: { id: string; message: string } | null;
} {
  const { execute, isLoading, error, data } = useAsync((file: File) =>
    uploadSVG(file)
  );
  return {
    upload: execute,
    isUploading: isLoading,
    error: error as Error | null,
    result: data as { id: string; message: string } | null,
  };
}
