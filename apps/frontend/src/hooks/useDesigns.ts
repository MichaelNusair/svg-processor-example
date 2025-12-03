import { useCallback } from 'react';
import { getDesigns, getDesign, uploadSVG } from '../api';
import { useAsync, useFetch } from './useAsync';

export function useDesignList(): ReturnType<
  typeof useFetch<ReturnType<typeof getDesigns>>
> & { designs: ReturnType<typeof getDesigns> } {
  const result = useFetch(getDesigns, []);
  return { designs: result.data ?? [], ...result };
}

export function useDesign(
  id: string | undefined
): ReturnType<typeof useFetch<ReturnType<typeof getDesign>>> & {
  design: ReturnType<typeof getDesign> | undefined;
} {
  const fetchDesign = useCallback(() => {
    if (!id) return Promise.reject(new Error('No ID'));
    return getDesign(id);
  }, [id]);

  const result = useFetch(fetchDesign, [id]);
  return { design: result.data, ...result };
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
  return { upload: execute, isUploading: isLoading, error, result: data };
}
