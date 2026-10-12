import { progressFromEvent, parseStreamLine, findResult, LineSplitter } from '../src/worker/progress.js';

describe('прогресс запуска', () => {
  it('берёт описание вызова инструмента', () => {
    const event = {
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'npm test' } }] },
    };
    expect(progressFromEvent(event)).toBe('Bash: npm test');
  });

  it('берёт текст ассистента, если инструмента нет', () => {
    const event = { type: 'assistant', message: { content: [{ type: 'text', text: 'Пишу тесты' }] } };
    expect(progressFromEvent(event)).toBe('Пишу тесты');
  });

  it('игнорирует служебные события и пустой текст', () => {
    expect(progressFromEvent({ type: 'system' })).toBeNull();
    expect(progressFromEvent({ type: 'assistant', message: { content: [{ type: 'text', text: '  ' }] } })).toBeNull();
  });

  it('обрезает длинный текст и сводит к одной строке', () => {
    const text = `первая строка\n${'а'.repeat(500)}`;
    const out = progressFromEvent({ type: 'assistant', message: { content: [{ type: 'text', text }] } });
    expect(out.includes('\n')).toBe(false);
    expect(out.length).toBeLessThanOrEqual(300);
  });

  it('пропускает битые строки stdout', () => {
    expect(parseStreamLine('не json')).toBeNull();
    expect(parseStreamLine('')).toBeNull();
    expect(parseStreamLine('{"type":"system"}')).toEqual({ type: 'system' });
  });

  it('находит итоговый результат среди событий', () => {
    const stdout = [
      '{"type":"system"}',
      '{"type":"assistant","message":{"content":[]}}',
      '{"type":"result","session_id":"abc","total_cost_usd":0.5,"result":"готово","is_error":false}',
    ].join('\n');
    expect(findResult(stdout)).toMatchObject({ session_id: 'abc', total_cost_usd: 0.5 });
    expect(findResult('только текст')).toBeNull();
  });

  it('собирает строки из кусков потока, включая хвост без перевода строки', () => {
    const splitter = new LineSplitter();
    expect(splitter.push('{"a":')).toEqual([]);
    expect(splitter.push('1}\n{"b"')).toEqual(['{"a":1}']);
    expect(splitter.push(':2}\n')).toEqual(['{"b":2}']);
    splitter.push('{"c":3}');
    expect(splitter.flush()).toEqual(['{"c":3}']);
  });
});
