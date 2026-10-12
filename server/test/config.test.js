import { describe, it, expect } from '@jest/globals';
import { readConfig, assertStartupConfig } from '../src/config.js';

describe('конфигурация из окружения', () => {
  it('пустая строка считается «не задано» и даёт значение по умолчанию', () => {
    const cfg = readConfig({ PORT: '', DEFAULT_BRANCH: '', CLAUDE_BIN: '', RUN_TIMEOUT_MIN: '' });
    expect(cfg.port).toBe(3001);
    expect(cfg.worker.defaultBranch).toBe('main');
    expect(cfg.worker.claudeBin).toBe('claude');
    expect(cfg.worker.timeoutMin).toBe(30);
    expect(cfg.telegram.ownerId).toBeUndefined();
  });

  it('читает значения и строит адрес API воркера от порта', () => {
    const cfg = readConfig({ PORT: '4000', TELEGRAM_OWNER_ID: '42', RUN_TIMEOUT_MIN: '5' });
    expect(cfg.port).toBe(4000);
    expect(cfg.telegram.ownerId).toBe('42');
    expect(cfg.worker.apiUrl).toBe('http://localhost:4000/api');
    expect(cfg.worker.timeoutMin).toBe(5);
  });

  it('без MONGO_URL и JWT_SECRET запуск отклоняется с перечислением', () => {
    expect(() => assertStartupConfig(readConfig({}))).toThrow(/MONGO_URL, JWT_SECRET/);
  });

  it('без необязательных переменных запуск разрешён, но сообщает о предупреждениях', () => {
    const warnings = assertStartupConfig(readConfig({ MONGO_URL: 'mongodb://x', JWT_SECRET: 's' }));
    expect(warnings).toEqual([
      'ADMIN_PASSWORD: вход по паролю отключён',
      'TELEGRAM_BOT_TOKEN: Telegram отключён',
    ]);
  });
});
