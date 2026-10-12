import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useResource } from './useResource.js';

describe('useResource', () => {
  it('сообщает об ошибке, а после успешной перезагрузки ошибку сбрасывает', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('сеть недоступна'))
      .mockResolvedValueOnce([1, 2]);

    const { result } = renderHook(() => useResource(fetcher, []));

    await waitFor(() => expect(result.current.error).toBe('сеть недоступна'));
    expect(result.current.loaded).toBe(true);

    await act(() => result.current.load());

    expect(result.current.data).toEqual([1, 2]);
    expect(result.current.error).toBe('');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
