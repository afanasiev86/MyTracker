import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTasks, setToken, clearToken, UNAUTHORIZED_EVENT } from './api.js';

describe('api: ошибки', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('отправляет событие, когда токен истёк', async () => {
    setToken('old-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Токен недействителен' }), { status: 401 }),
    ));
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);

    await expect(fetchTasks()).rejects.toThrow('Токен недействителен');
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it('не отправляет событие без токена (первый вход)', async () => {
    clearToken();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Нужна авторизация' }), { status: 401 }),
    ));
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);

    await expect(fetchTasks()).rejects.toThrow();
    expect(listener).not.toHaveBeenCalled();

    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it('объясняет обрыв связи по-русски', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchTasks()).rejects.toThrow('Нет связи с сервером');
  });
});
