import { jest } from '@jest/globals';
import { canTransition, allowedTargets, RUNNABLE_FROM, TASK_STATUSES } from '../../shared/statuses.js';
import { registerRun, unregisterRun, stopRun, isRunning } from '../src/worker/processes.js';
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

describe('статус «Нужен ответ»', () => {
  it('есть в списке статусов и не отдаётся вручную', () => {
    expect(TASK_STATUSES).toContain('waiting');
    expect(allowedTargets('waiting')).not.toContain('in_progress');
    expect(RUNNABLE_FROM).not.toContain('waiting');
  });
});

describe('реестр процессов', () => {
  it('остановка несуществующего запуска возвращает false', () => {
    expect(stopRun('no-such-task', 'cancelled')).toBe(false);
    expect(isRunning('no-such-task')).toBe(false);
  });

  it('остановка запущенного процесса передаёт SIGTERM и запоминает причину', () => {
    const signals = [];
    registerRun('t1', { kill: (signal) => signals.push(signal) });
    expect(isRunning('t1')).toBe(true);
    expect(stopRun('t1', 'timeout')).toBe(true);
    expect(signals).toEqual(['SIGTERM']);
    expect(unregisterRun('t1').reason).toBe('timeout');
    expect(isRunning('t1')).toBe(false);
  });
});

describe('остановка процесса', () => {
  it('добивает процесс SIGKILL, если он не завершился после SIGTERM', () => {
    jest.useFakeTimers();
    const signals = [];
    registerRun('stubborn', { exitCode: null, signalCode: null, kill: (s) => signals.push(s) });
    stopRun('stubborn', 'timeout');
    expect(signals).toEqual(['SIGTERM']);
    jest.advanceTimersByTime(10 * 1000);
    expect(signals).toEqual(['SIGTERM', 'SIGKILL']);
    unregisterRun('stubborn');
    jest.useRealTimers();
  });

  it('не добивает процесс, который уже завершился', () => {
    jest.useFakeTimers();
    const signals = [];
    registerRun('quiet', { exitCode: 0, signalCode: null, kill: (s) => signals.push(s) });
    stopRun('quiet', 'cancelled');
    jest.advanceTimersByTime(10 * 1000);
    unregisterRun('quiet');
    expect(signals).toEqual(['SIGTERM']);
    jest.useRealTimers();
  });
});
