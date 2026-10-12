import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Board from './Board.jsx';
import { NewTaskRoute, TaskRoute } from './board/TaskRoutes.jsx';
import * as api from '../api.js';

vi.mock('../api.js');

const tasks = [
  { _id: '1', title: 'Фильтр по цене', project: 'shop', status: 'ready', runs: [] },
  {
    _id: '2',
    title: 'Экспорт CSV',
    project: 'crm',
    status: 'review',
    runs: [{ costUsd: 0.5 }, { costUsd: 0.25 }],
  },
];

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/tasks" element={<Board />}>
          <Route path="new" element={<NewTaskRoute />} />
          <Route path=":id" element={<TaskRoute />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Board', () => {
  beforeEach(() => {
    vi.mocked(api.fetchTasks).mockResolvedValue(tasks);
    vi.mocked(api.fetchCosts).mockResolvedValue([{ project: 'crm', costUsd: 0.75, runs: 2 }]);
  });

  it('показывает стоимость задачи на карточке и сводку по проектам', async () => {
    renderAt('/tasks');

    // $0.75 встречается дважды: в сводке и на карточке с двумя запусками
    const matches = await screen.findAllByText(/\$0\.75/);
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Всего:/)).toBeTruthy();
  });

  it('показывает колонки по статусам и карточки в них', async () => {
    renderAt('/tasks');

    expect(await screen.findByText('Фильтр по цене')).toBeTruthy();
    expect(screen.getByText('Экспорт CSV')).toBeTruthy();
    expect(screen.getByText('Готово к работе')).toBeTruthy();
    expect(screen.getByText('На проверке')).toBeTruthy();
  });

  it('по адресу /tasks/:id открывает карточку задачи', async () => {
    vi.mocked(api.getTask).mockResolvedValue({
      ...tasks[0],
      goal: '',
      acceptance: [],
      outOfScope: '',
      context: '',
      branch: '',
      comments: [],
    });
    renderAt('/tasks/1');

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(api.getTask).toHaveBeenCalledWith('1');
  });

  it('по адресу /tasks/new открывает форму новой задачи', async () => {
    vi.mocked(api.fetchProjects).mockResolvedValue([]);
    renderAt('/tasks/new');

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Новая задача')).toBeTruthy();
  });
});
