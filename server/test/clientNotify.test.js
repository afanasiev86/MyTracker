import { shouldNotifyClient, clientStatusMessage } from '../src/services/clientNotify.js';

describe('уведомления заказчику о смене статуса', () => {
  it('сообщает о переходе видимого статуса', () => {
    expect(shouldNotifyClient('ready', 'review')).toBe(true);
    expect(shouldNotifyClient('review', 'done')).toBe(true);
    expect(shouldNotifyClient('in_progress', 'failed')).toBe(true);
    expect(shouldNotifyClient('backlog', 'ready')).toBe(true);
  });

  it('не сообщает, если заказчик видит ту же подпись', () => {
    // ready и in_progress различаются, а waiting и in_progress — нет
    expect(shouldNotifyClient('waiting', 'waiting')).toBe(false);
    expect(shouldNotifyClient('done', 'done')).toBe(false);
  });

  it('не сообщает о переходе в черновик', () => {
    expect(shouldNotifyClient('ready', 'backlog')).toBe(false);
    expect(shouldNotifyClient('waiting', 'backlog')).toBe(false);
  });

  it('текст содержит название, проект и подпись статуса, без внутренних деталей', () => {
    const text = clientStatusMessage('Кнопка входа', 'Сайт магазина', 'review');
    expect(text).toContain('«Кнопка входа»');
    expect(text).toContain('Сайт магазина');
    expect(text).toContain('На проверке');
    expect(text).not.toMatch(/запуск|worktree|stream|sessionId/i);
  });
});
