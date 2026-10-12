import { describe, it, expect } from '@jest/globals';
import { encodeOpsCallback, decodeOpsCallback, confirmKeyboard, OPS_CONFIRM_TTL_MIN } from '../src/bot/opsCallbackData.js';
import { findProblems, diffProblems } from '../src/services/ops/monitor.js';
import { formatStatus, formatUptime } from '../src/services/ops/format.js';
import { clampLines } from '../src/services/ops/logs.js';
import { SERVICES } from '../src/services/ops/catalog.js';

const GB = 1024 ** 3;
const metrics = (over = {}) => ({
  uptimeSec: 3 * 86400 + 4 * 3600,
  cpu: { cores: 2, load: [0.42, 0.3, 0.2], percent: 21 },
  memory: { total: 4 * GB, used: 1 * GB, percent: 25 },
  disk: { total: 40 * GB, used: 12 * GB, percent: 30 },
  ...over,
});
const svc = (id, status) => ({ id, label: id, actions: [], status });

describe('кнопки подтверждения действий над сервером', () => {
  it('кодируются в пределах лимита Telegram и читаются обратно', () => {
    const data = encodeOpsCallback('restart', 'mytracker-api');
    expect(Buffer.byteLength(data)).toBeLessThanOrEqual(64);
    expect(decodeOpsCallback(data)).toEqual({ action: 'restart', target: 'mytracker-api' });
  });

  it('подтверждение устаревает через несколько минут', () => {
    const now = Date.now();
    const data = encodeOpsCallback('deploy', '-', now);
    expect(decodeOpsCallback(data, now + (OPS_CONFIRM_TTL_MIN - 1) * 60000)).toEqual({ action: 'deploy', target: '-' });
    expect(decodeOpsCallback(data, now + (OPS_CONFIRM_TTL_MIN + 2) * 60000)).toEqual({ expired: true });
  });

  it('чужие и испорченные данные не принимаются', () => {
    expect(decodeOpsCallback('accept:507f1f77bcf86cd799439011')).toBeNull();
    expect(decodeOpsCallback('ops:restart;rm -rf /:abc')).toBeNull();
    expect(decodeOpsCallback(undefined)).toBeNull();
  });

  it('клавиатура содержит «Подтвердить» и «Отмена»', () => {
    const [row] = confirmKeyboard('stop', 'nginx').inline_keyboard;
    expect(row.map((b) => b.text)).toEqual(['Подтвердить', 'Отмена']);
    expect(decodeOpsCallback(row[1].callback_data)).toEqual({ action: 'cancel', target: '-' });
  });
});

describe('каталог сервисов', () => {
  it('сам API можно только перезапустить, остановить его отсюда нельзя', () => {
    expect(SERVICES.find((s) => s.id === 'mytracker-api').actions).toEqual(['restart']);
  });

  it('у Docker действий нет: остановка уронит базу и хранилище', () => {
    expect(SERVICES.find((s) => s.id === 'docker').actions).toEqual([]);
  });
});

describe('проблемы сервера', () => {
  it('диск и память выше порога, остановленный сервис попадают в список', () => {
    const problems = findProblems({
      metrics: metrics({ disk: { total: 1, used: 1, percent: 93 }, memory: { total: 1, used: 1, percent: 95 } }),
      services: [svc('nginx', 'inactive'), svc('mongo', 'active')],
    });
    expect([...problems.keys()].sort()).toEqual(['disk', 'memory', 'service:nginx']);
  });

  it('неизвестное состояние и запуск не считаются поломкой', () => {
    const problems = findProblems({ metrics: metrics(), services: [svc('nginx', 'unknown'), svc('mongo', 'activating')] });
    expect(problems.size).toBe(0);
  });

  it('сервис, который владелец остановил сам, не считается поломкой', () => {
    const problems = findProblems({ metrics: metrics(), services: [svc('nginx', 'inactive')] }, new Set(['nginx']));
    expect(problems.size).toBe(0);
  });

  it('сообщает только об изменениях: новая проблема и исправление', () => {
    const before = new Map([['service:nginx', 'nginx не работает']]);
    const after = new Map([['disk', 'диск заполнен на 93%']]);
    expect(diffProblems(before, after)).toEqual([
      'Проблема на сервере: диск заполнен на 93%.',
      'Исправлено: nginx снова работает.',
    ]);
    expect(diffProblems(after, after)).toEqual([]);
  });
});

describe('сводка для бота', () => {
  it('показывает ресурсы и состояние сервисов', () => {
    const text = formatStatus({ available: true, metrics: metrics(), services: [svc('nginx', 'active'), svc('mongo', 'failed')] });
    expect(text).toContain('Сервер работает 3 д 4 ч');
    expect(text).toContain('Память: 1.0 из 4.0 ГБ (25%)');
    expect(text).toContain('Диск: 12.0 из 40.0 ГБ (30%)');
    expect(text).toContain('+ nginx: работает');
    expect(text).toContain('- mongo: сбой');
  });

  it('без Linux честно говорит, что сервисы недоступны', () => {
    const text = formatStatus({ available: false, metrics: metrics(), services: [] });
    expect(text).toContain('сервер не на Linux');
  });

  it('время работы в удобных единицах', () => {
    expect(formatUptime(125)).toBe('2 мин');
    expect(formatUptime(3 * 3600 + 5 * 60)).toBe('3 ч 5 мин');
  });
});

describe('число строк журнала', () => {
  it('ограничено диапазоном, мусор заменяется значением по умолчанию', () => {
    expect(clampLines('5')).toBe(10);
    expect(clampLines('9999')).toBe(200);
    expect(clampLines('abc')).toBe(50);
    expect(clampLines(undefined)).toBe(50);
    expect(clampLines('120')).toBe(120);
  });
});
