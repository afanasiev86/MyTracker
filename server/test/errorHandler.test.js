import { describe, it, expect } from '@jest/globals';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { domainError } from '../src/services/errors.js';

// Фейковый ответ Express: запоминаем статус и тело
function fakeRes() {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

describe('единая обработка ошибок', () => {
  it.each([
    ['invalid', 400],
    ['not_found', 404],
    ['conflict', 409],
    ['unsupported', 415],
    ['too_large', 413],
    ['unavailable', 503],
  ])('доменная ошибка %s отдаёт статус %i и текст сообщения', (code, status) => {
    const res = fakeRes();
    errorHandler(domainError(code, 'Понятный текст'), {}, res, () => {});
    expect(res.statusCode).toBe(status);
    expect(res.body).toEqual({ error: 'Понятный текст' });
  });

  it('неизвестная ошибка отдаёт 500 без внутренних деталей', () => {
    const res = fakeRes();
    const originalError = console.error;
    console.error = () => {};
    try {
      errorHandler(new Error('секрет в тексте'), {}, res, () => {});
    } finally {
      console.error = originalError;
    }
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Внутренняя ошибка' });
  });
});
