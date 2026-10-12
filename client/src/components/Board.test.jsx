import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Board from './Board.jsx';
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

describe('Board', () => {
  beforeEach(() => {
    vi.mocked(api.fetchTasks).mockResolvedValue(tasks);
    vi.mocked(api.fetchCosts).mockResolvedValue([{ project: 'crm', costUsd: 0.75, runs: 2 }]);
  });

  it('показывает стоимость задачи на карточке и сводку по проектам', async () => {
    render(<Board />);

    // $0.75 встречается дважды: в сводке и на карточке с двумя запусками
    const matches = await screen.findAllByText(/\$0\.75/);
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Всего:/)).toBeTruthy();
  });

  it('показывает колонки по статусам и карточки в них', async () => {
    render(<Board />);

    expect(await screen.findByText('Фильтр по цене')).toBeTruthy();
    expect(screen.getByText('Экспорт CSV')).toBeTruthy();
    expect(screen.getByText('Готово к работе')).toBeTruthy();
    expect(screen.getByText('На проверке')).toBeTruthy();
  });
});
