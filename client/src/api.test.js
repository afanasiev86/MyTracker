import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTasks, setToken, clearToken, revokeAllSessions, UNAUTHORIZED_EVENT } from './api.js';

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

describe('api: выход на всех устройствах', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('отправляет запрос на отзыв токенов с текущим токеном', async () => {
    setToken('current-token');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await revokeAllSessions();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/auth\/revoke$/);
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer current-token');
  });
});
