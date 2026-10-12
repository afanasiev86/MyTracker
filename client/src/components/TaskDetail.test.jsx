import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
