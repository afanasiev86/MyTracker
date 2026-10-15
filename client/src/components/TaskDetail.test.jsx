import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskDetail from './TaskDetail.jsx';
import * as api from '../api.js';

vi.mock('../api.js');

const baseTask = {
  _id: 'abc',
  title: 'Фильтр по цене',
  project: 'shop',
  goal: 'Ускорить поиск',
  acceptance: ['Фильтр применяется к каталогу'],
  outOfScope: 'Карточка товара',
  context: '',
  branch: '',
  runs: [],
  comments: [],
};

describe('TaskDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('для готовой задачи показывает запуск и переход в бэклог, но не «В работе»', async () => {
    vi.mocked(api.getTask).mockResolvedValue({ ...baseTask, status: 'ready' });

    render(<TaskDetail id="abc" onChanged={() => {}} onClose={() => {}} />);

    expect(await screen.findByText('Запустить в Claude')).toBeTruthy();
    expect(screen.getByText('Вернуть в бэклог')).toBeTruthy();
    expect(screen.queryByText(/В работе/)).toBeNull();
  });

  it('на проверке предлагает вернуть в работу и отметить готовой', async () => {
    vi.mocked(api.getTask).mockResolvedValue({
      ...baseTask,
      status: 'review',
      branch: 'task/abc',
    });

    render(<TaskDetail id="abc" onChanged={() => {}} onClose={() => {}} />);

    expect(await screen.findByText('Вернуть в работу')).toBeTruthy();
    expect(screen.getByText('Принять результат')).toBeTruthy();
    expect(screen.getByText('Показать diff')).toBeTruthy();
  });

  it('выводит критерии приёмки', async () => {
    vi.mocked(api.getTask).mockResolvedValue({ ...baseTask, status: 'backlog' });

    render(<TaskDetail id="abc" onChanged={() => {}} onClose={() => {}} />);

    expect(await screen.findByText('Фильтр применяется к каталогу')).toBeTruthy();
  });
});

describe('TaskDetail: вопрос Claude', () => {
  it('для задачи, которая ждёт ответа, показывает вопрос и форму ответа', async () => {
    vi.mocked(api.getTask).mockResolvedValue({
      ...baseTask,
      status: 'waiting',
      pendingQuestion: 'Какой формат цены показывать?',
    });

    render(<TaskDetail id="abc" onChanged={() => {}} onClose={() => {}} />);

    expect(await screen.findByText('Какой формат цены показывать?')).toBeTruthy();
    expect(screen.getByText('Ответить и продолжить')).toBeTruthy();
  });

  it('во время работы предлагает отменить запуск', async () => {
    vi.mocked(api.getTask).mockResolvedValue({ ...baseTask, status: 'in_progress' });

    render(<TaskDetail id="abc" onChanged={() => {}} onClose={() => {}} />);

    expect(await screen.findByText('Отменить запуск')).toBeTruthy();
  });
});

describe('TaskDetail: ошибка запуска', () => {
  const failed = {
    ...baseTask,
    status: 'failed',
    runs: [
      { startedAt: '2026-10-01T10:00:00Z', summary: 'Claude не создал коммитов.' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('для упавшей задачи показывает причину и кнопку «Попросить Claude исправить»', async () => {
    vi.mocked(api.getTask).mockResolvedValue(failed);

    render(<TaskDetail id="abc" onChanged={() => {}} onClose={() => {}} />);

    expect(await screen.findByText('Запуск завершился ошибкой')).toBeTruthy();
    expect(screen.getAllByText('Claude не создал коммитов.').length).toBeGreaterThan(0);
    expect(screen.getByText('Попросить Claude исправить')).toBeTruthy();
  });

  it('отправляет подсказку без пробелов по краям и перечитывает задачу', async () => {
    vi.mocked(api.getTask).mockResolvedValue(failed);
    vi.mocked(api.fixTask).mockResolvedValue({ _id: 'abc', status: 'in_progress' });
    const onChanged = vi.fn();

    render(<TaskDetail id="abc" onChanged={onChanged} onClose={() => {}} />);

    const hint = await screen.findByLabelText(/Подсказка для Claude/);
    fireEvent.change(hint, { target: { value: '  проверь тесты  ' } });
    fireEvent.click(screen.getByText('Попросить Claude исправить'));

    await waitFor(() => expect(api.fixTask).toHaveBeenCalledWith('abc', 'проверь тесты'));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('без подсказки тоже отправляет просьбу', async () => {
    vi.mocked(api.getTask).mockResolvedValue(failed);
    vi.mocked(api.fixTask).mockResolvedValue({ _id: 'abc', status: 'in_progress' });

    render(<TaskDetail id="abc" onChanged={() => {}} onClose={() => {}} />);

    fireEvent.click(await screen.findByText('Попросить Claude исправить'));

    await waitFor(() => expect(api.fixTask).toHaveBeenCalledWith('abc', ''));
  });

  it('показывает ошибку сервера и не теряет введённую подсказку', async () => {
    vi.mocked(api.getTask).mockResolvedValue(failed);
    vi.mocked(api.fixTask).mockRejectedValue(new Error('Исправлять можно только задачу в статусе «Ошибка»'));

    render(<TaskDetail id="abc" onChanged={() => {}} onClose={() => {}} />);

    const hint = await screen.findByLabelText(/Подсказка для Claude/);
    fireEvent.change(hint, { target: { value: 'смотри лог' } });
    fireEvent.click(screen.getByText('Попросить Claude исправить'));

    expect(await screen.findByText(/Исправлять можно только задачу/)).toBeTruthy();
    expect(screen.getByLabelText(/Подсказка для Claude/).value).toBe('смотри лог');
  });

  it('у задач в других статусах блока ошибки нет', async () => {
    vi.mocked(api.getTask).mockResolvedValue({ ...baseTask, status: 'review' });

    render(<TaskDetail id="abc" onChanged={() => {}} onClose={() => {}} />);

    await screen.findByText('Принять результат');
    expect(screen.queryByText('Попросить Claude исправить')).toBeNull();
  });
});
