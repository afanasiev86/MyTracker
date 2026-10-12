import { canTransition, allowedTargets, RUNNABLE_FROM } from '../../shared/statuses.js';
import { parseCommand } from '../src/bot/commands.js';
import { isLimitError } from '../src/worker/limits.js';

describe('статусы', () => {
  it('разрешает ручные переходы по правилам', () => {
    expect(canTransition('backlog', 'ready')).toBe(true);
    expect(canTransition('review', 'done')).toBe(true);
    expect(canTransition('failed', 'ready')).toBe(true);
  });

  it('запрещает прыжки через этапы', () => {
    expect(canTransition('backlog', 'done')).toBe(false);
    expect(canTransition('ready', 'done')).toBe(false);
    expect(canTransition('done', 'ready')).toBe(false);
  });

  it('не даёт вручную ставить in_progress (только запуском)', () => {
    expect(allowedTargets('ready')).not.toContain('in_progress');
    expect(allowedTargets('review')).not.toContain('in_progress');
  });

  it('запускать можно только из готовых статусов', () => {
    expect(RUNNABLE_FROM).toEqual(['ready', 'review', 'failed']);
    expect(RUNNABLE_FROM).not.toContain('backlog');
  });
});

describe('команды Telegram', () => {
  it('разбирает команду и аргументы', () => {
    expect(parseCommand('/new shop Добавить фильтр')).toEqual({
      cmd: '/new',
      args: ['shop', 'Добавить', 'фильтр'],
    });
  });

  it('убирает имя бота из команды', () => {
    expect(parseCommand('/RUN@my_bot abc').cmd).toBe('/run');
  });
});

describe('определение лимита', () => {
  it('распознаёт сообщения о лимите', () => {
    expect(isLimitError('Claude AI usage limit reached')).toBe(true);
    expect(isLimitError('Достигнут лимит использования')).toBe(true);
  });

  it('не срабатывает на обычные ошибки', () => {
    expect(isLimitError('TypeError: cannot read property')).toBe(false);
    expect(isLimitError('')).toBe(false);
    expect(isLimitError(undefined)).toBe(false);
  });
});
