import { encodeCallback, decodeCallback, reviewKeyboard } from '../src/bot/callbackData.js';
import { buildDigest } from '../src/services/digest/buildDigest.js';
import { moscowParts } from '../src/services/digest/moscowParts.js';

const ID = '65f1a2b3c4d5e6f708192a3b';

describe('кнопки Telegram', () => {
  it('кодирует и декодирует действие с ID задачи', () => {
    expect(decodeCallback(encodeCallback('accept', ID))).toEqual({ action: 'accept', id: ID });
  });

  it('отбрасывает неизвестные действия и битые ID', () => {
    expect(decodeCallback(`delete:${ID}`)).toBeNull();
    expect(decodeCallback('accept:not-an-id')).toBeNull();
    expect(decodeCallback(undefined)).toBeNull();
  });

  it('укладывается в лимит Telegram на callback_data (64 байта)', () => {
    const kb = reviewKeyboard(ID);
    for (const row of kb.inline_keyboard) {
      for (const button of row) {
        expect(Buffer.byteLength(button.callback_data)).toBeLessThanOrEqual(64);
      }
    }
  });
});

describe('день по Москве', () => {
  it('считает день по Москве, а не по UTC', () => {
    // 22:00 UTC 11 октября = 01:00 12 октября по Москве
    expect(moscowParts(new Date('2026-10-11T22:00:00Z')).day).toBe('2026-10-12');
    expect(moscowParts(new Date('2026-10-11T22:00:00Z')).hour).toBe(1);
  });
});

describe('дайджест', () => {
  const now = new Date('2026-10-12T06:00:00Z'); // 09:00 по Москве

  it('ничего не сообщает, если задач нет', () => {
    expect(buildDigest([], now)).toBeNull();
  });

  it('выводит просроченные, на сегодня и ожидающие ответа', () => {
    const tasks = [
      { project: 'shop', title: 'Старая', status: 'ready', dueDate: new Date('2026-10-10T10:00:00Z') },
      { project: 'shop', title: 'Сегодня', status: 'ready', dueDate: new Date('2026-10-12T12:00:00Z') },
      { project: 'blog', title: 'Вопрос', status: 'waiting' },
      { project: 'blog', title: 'Сделана', status: 'done', dueDate: new Date('2026-10-10T10:00:00Z') },
    ];
    const text = buildDigest(tasks, now);
    expect(text).toContain('Просрочено (1)');
    expect(text).toContain('• shop: Старая');
    expect(text).toContain('Сегодня (1)');
    expect(text).toContain('Ждут ответа (1)');
    expect(text).not.toContain('Сделана');
  });

  it('не считает задачу на завтра сегодняшней', () => {
    const tasks = [{ project: 'shop', title: 'Завтра', status: 'ready', dueDate: new Date('2026-10-13T12:00:00Z') }];
    expect(buildDigest(tasks, now)).toBeNull();
  });
});
