import { withTimeout } from '../src/services/health.js';

describe('withTimeout', () => {
  it('возвращает результат, если сервис ответил вовремя', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 100)).resolves.toBe('ok');
  });

  it('отказывает, если сервис молчит дольше лимита', async () => {
    await expect(withTimeout(new Promise(() => {}), 20)).rejects.toThrow('нет ответа');
  });

  it('пробрасывает собственную ошибку сервиса без задержки', async () => {
    await expect(withTimeout(Promise.reject(new Error('закрыто')), 1000)).rejects.toThrow('закрыто');
  });
});
