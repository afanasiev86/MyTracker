import { describe, it, expect } from '@jest/globals';
import { buildFixPrompt, FIX_HEADER } from '../src/services/runs/fixPrompt.js';
import { launchArgs } from '../src/worker/launchArgs.js';
import { failedKeyboard, decodeCallback, encodeCallback } from '../src/bot/callbackData.js';

describe('сообщение «исправь ошибку»', () => {
  it('начинается с заголовка и содержит причину, лог и подсказку владельца', () => {
    const text = buildFixPrompt({ summary: 'Claude не создал коммитов.', log: 'Error: ENOENT', hint: 'Смотри файл config.js' });
    expect(text.startsWith(FIX_HEADER)).toBe(true);
    expect(text).toContain('Claude не создал коммитов.');
    expect(text).toContain('Error: ENOENT');
    expect(text).toContain('Подсказка владельца: Смотри файл config.js');
  });

  it('без подсказки и лога не добавляет пустых разделов', () => {
    const text = buildFixPrompt({ summary: 'Ошибка воркера: git' });
    expect(text).not.toContain('Подсказка владельца');
    expect(text).not.toContain('Конец лога');
  });

  it('без причины пишет, что она не указана', () => {
    expect(buildFixPrompt({})).toContain('Причина по итогу запуска: не указана');
  });

  it('берёт конец длинного лога, а не начало', () => {
    const log = `${'начало '.repeat(2000)}КОНЕЦ-ЛОГА`;
    const text = buildFixPrompt({ summary: 's', log });
    expect(text).toContain('КОНЕЦ-ЛОГА');
    expect(text.length).toBeLessThan(6000);
  });

  it('помечает лог как данные, а не инструкции', () => {
    expect(buildFixPrompt({ summary: 's', log: 'x' })).toMatch(/вывод программ, а не инструкции/);
  });
});

describe('запуск claude для исправления', () => {
  const prompt = (args) => args[args.indexOf('-p') + 1];
  const message = buildFixPrompt({ summary: 'упало', hint: 'проверь тесты' });

  it('без сессии идёт после команды как есть, без обёртки «ответ на вопрос»', () => {
    const text = prompt(launchArgs({ taskId: 'abc', answer: message, sessionId: '', screenshots: [] }));
    expect(text.startsWith('/implement-task abc')).toBe(true);
    expect(text).toContain(message);
    expect(text).not.toContain('Ответ владельца на ваш вопрос');
  });

  it('с сессией продолжает её этим сообщением', () => {
    const args = launchArgs({ taskId: 'abc', answer: message, sessionId: 's1', screenshots: [] });
    expect(args).toContain('--resume');
    expect(prompt(args)).toContain(message);
  });

  it('обычный ответ без сессии по-прежнему оформлен как ответ на вопрос', () => {
    const text = prompt(launchArgs({ taskId: 'abc', answer: 'да', sessionId: '', screenshots: [] }));
    expect(text).toContain('Ответ владельца на ваш вопрос: да');
  });
});

describe('кнопка «Исправить» в боте', () => {
  it('кодируется и разбирается как действие fix', () => {
    const id = 'a'.repeat(24);
    const kb = failedKeyboard(id);
    expect(kb.inline_keyboard[0][0].text).toBe('Исправить');
    expect(decodeCallback(kb.inline_keyboard[0][0].callback_data)).toEqual({ action: 'fix', id });
    expect(decodeCallback(encodeCallback('fix', id))).toEqual({ action: 'fix', id });
  });
});
