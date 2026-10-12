import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Unit-тесты правил задач. Хранилище подменено, база не нужна.
const findTask = jest.fn();
const projectExists = jest.fn();
jest.unstable_mockModule('../src/services/store/tasks.js', () => ({ findTask }));
jest.unstable_mockModule('../src/services/store/projects.js', () => ({ projectExists }));

const { patchTask } = await import('../src/services/tasks/patchTask.js');
const { askQuestion } = await import('../src/services/tasks/askQuestion.js');

// Фейковая задача: запоминаем вызов save и поля
function makeTask(status, extra = {}) {
  return {
    status,
    project: 'shop',
    pendingQuestion: '',
    save: jest.fn(async () => {}),
    toObject() { return { status: this.status, project: this.project, pendingQuestion: this.pendingQuestion }; },
    ...extra,
  };
}

beforeEach(() => {
  findTask.mockReset();
  projectExists.mockReset();
  projectExists.mockResolvedValue(true);
});

describe('patchTask: правила правки и переходов', () => {
  it('задачи нет: not_found', async () => {
    findTask.mockResolvedValue(null);
    await expect(patchTask('x', { title: 'a' })).rejects.toMatchObject({ code: 'not_found' });
  });

  it('вручную нельзя поставить «В работе»: conflict, задача не сохраняется', async () => {
    const task = makeTask('ready');
    findTask.mockResolvedValue(task);
    await expect(patchTask('x', { status: 'in_progress' })).rejects.toMatchObject({ code: 'conflict' });
    expect(task.save).not.toHaveBeenCalled();
  });

  it('недопустимый переход: conflict (из «На проверке» в «Бэклог»)', async () => {
    const task = makeTask('review');
    findTask.mockResolvedValue(task);
    await expect(patchTask('x', { status: 'backlog' })).rejects.toMatchObject({ code: 'conflict' });
    expect(task.save).not.toHaveBeenCalled();
  });

  it('допустимый переход применяется и сохраняется', async () => {
    const task = makeTask('ready');
    findTask.mockResolvedValue(task);
    const result = await patchTask('x', { status: 'backlog' });
    expect(task.status).toBe('backlog');
    expect(task.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'backlog', project: 'shop', pendingQuestion: '' });
  });

  it('тот же статус не проверяется по таблице переходов', async () => {
    const task = makeTask('done');
    findTask.mockResolvedValue(task);
    await expect(patchTask('x', { status: 'done' })).resolves.toBeDefined();
    expect(task.save).toHaveBeenCalled();
  });

  it('смена проекта проверяет, что новый проект существует', async () => {
    const task = makeTask('backlog');
    findTask.mockResolvedValue(task);
    projectExists.mockResolvedValue(false);
    await expect(patchTask('x', { project: 'ghost' })).rejects.toMatchObject({ code: 'invalid' });
    expect(projectExists).toHaveBeenCalledWith('ghost');
    expect(task.save).not.toHaveBeenCalled();
  });

  it('проект не меняется: существование не проверяется', async () => {
    const task = makeTask('backlog');
    findTask.mockResolvedValue(task);
    await patchTask('x', { project: 'shop', title: 'Новое' });
    expect(projectExists).not.toHaveBeenCalled();
  });
});

describe('askQuestion: вопрос только во время работы', () => {
  it('задачи нет: not_found', async () => {
    findTask.mockResolvedValue(null);
    await expect(askQuestion('x', 'Какой цвет?')).rejects.toMatchObject({ code: 'not_found' });
  });

  it('вне работы: conflict, вопрос не записывается', async () => {
    const task = makeTask('ready');
    findTask.mockResolvedValue(task);
    await expect(askQuestion('x', 'Какой цвет?')).rejects.toMatchObject({ code: 'conflict' });
    expect(task.pendingQuestion).toBe('');
    expect(task.save).not.toHaveBeenCalled();
  });

  it('в работе: вопрос сохраняется в pendingQuestion', async () => {
    const task = makeTask('in_progress');
    findTask.mockResolvedValue(task);
    await askQuestion('x', 'Какой цвет?');
    expect(task.pendingQuestion).toBe('Какой цвет?');
    expect(task.save).toHaveBeenCalledTimes(1);
  });
});
