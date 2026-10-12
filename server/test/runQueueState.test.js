import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Состояние очереди в задаче (queued, queuedAnswer) при запуске, ответе и отмене.
// Постановку в очередь и остановку процесса подменяем: база и процессы не нужны.
const enqueueRun = jest.fn();
const stopRun = jest.fn();
jest.unstable_mockModule('../src/services/runs/enqueueRun.js', () => ({ enqueueRun }));
jest.unstable_mockModule('../src/worker/processes/stopRun.js', () => ({ stopRun }));

const { startTask } = await import('../src/services/runs/startTask.js');
const { answerTask } = await import('../src/services/runs/answerTask.js');
const { cancelTask } = await import('../src/services/runs/cancelTask.js');
const { RUNNABLE_FROM } = await import('../../shared/statuses.js');

function makeTask(status, extra = {}) {
  return {
    _id: 'task-1',
    project: 'shop',
    priority: 'normal',
    status,
    queued: false,
    queuedAnswer: '',
    pendingQuestion: '',
    comments: [],
    save: jest.fn(async () => {}),
    ...extra,
  };
}

beforeEach(() => {
  enqueueRun.mockReset();
  stopRun.mockReset();
});

describe('startTask: запуск из статусов, из которых он разрешён', () => {
  it('разрешённые статусы: готово, на проверке, ошибка', () => {
    expect([...RUNNABLE_FROM].sort()).toEqual(['failed', 'ready', 'review']);
  });

  it('из «Готово к работе» ставит в очередь с пустым ответом', async () => {
    const task = makeTask('ready', { queuedAnswer: 'старый ответ' });
    const result = await startTask(task);
    expect(task.status).toBe('in_progress');
    expect(task.queued).toBe(true);
    expect(task.queuedAnswer).toBe('');
    expect(task.save).toHaveBeenCalledTimes(1);
    expect(enqueueRun).toHaveBeenCalledWith(task);
    expect(result).toEqual({ task });
  });

  it('из «Бэклог» отказывает с текстом ошибки, ничего не меняет', async () => {
    const task = makeTask('backlog');
    const result = await startTask(task);
    expect(result.error).toMatch(/запуск недоступен/);
    expect(task.status).toBe('backlog');
    expect(task.save).not.toHaveBeenCalled();
    expect(enqueueRun).not.toHaveBeenCalled();
  });
});

describe('answerTask: ответ владельца продолжает ожидающий запуск', () => {
  it('без статуса «Нужен ответ» отказывает и ничего не ставит в очередь', async () => {
    const task = makeTask('in_progress');
    const result = await answerTask(task, 'да');
    expect(result.error).toBe('Задача сейчас не ждёт ответа');
    expect(task.save).not.toHaveBeenCalled();
    expect(enqueueRun).not.toHaveBeenCalled();
  });

  it('в статусе «Нужен ответ» пишет ответ в комментарии, очищает вопрос и ставит в очередь с ответом', async () => {
    const task = makeTask('waiting', { pendingQuestion: 'Какой цвет?' });
    const result = await answerTask(task, 'синий');
    expect(task.comments).toEqual([{ author: 'owner', text: 'Ответ: синий' }]);
    expect(task.pendingQuestion).toBe('');
    expect(task.status).toBe('in_progress');
    expect(task.queued).toBe(true);
    expect(task.queuedAnswer).toBe('синий');
    expect(enqueueRun).toHaveBeenCalledWith(task, 'синий');
    expect(result).toEqual({ task });
  });
});

describe('cancelTask: отмена запуска', () => {
  it('не в работе — отказ', async () => {
    const task = makeTask('ready');
    const result = await cancelTask(task);
    expect(result.error).toBe('Отменить можно только задачу в работе');
    expect(task.save).not.toHaveBeenCalled();
  });

  it('процесс есть — останавливаем, статус не меняем, ждём завершения', async () => {
    stopRun.mockReturnValue(true);
    const task = makeTask('in_progress');
    const result = await cancelTask(task);
    expect(stopRun).toHaveBeenCalledWith('task-1', 'cancelled');
    expect(result).toEqual({ task, stopping: true });
    expect(task.status).toBe('in_progress');
    expect(task.save).not.toHaveBeenCalled();
  });

  it('процесса уже нет (например, после перезапуска) — сразу ошибка и сброс очереди', async () => {
    stopRun.mockReturnValue(false);
    const task = makeTask('in_progress', { queued: true, queuedAnswer: 'да' });
    const result = await cancelTask(task);
    expect(task.status).toBe('failed');
    expect(task.queued).toBe(false);
    expect(task.queuedAnswer).toBe('');
    expect(task.comments).toEqual([{ author: 'system', text: 'Запуск отменён вручную.' }]);
    expect(task.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ task, stopping: false });
  });
});
