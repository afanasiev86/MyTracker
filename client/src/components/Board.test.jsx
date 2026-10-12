import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Board from './Board.jsx';
import * as api from '../api.js';

vi.mock('../api.js');

const tasks = [
  { _id: '1', title: 'Фильтр по цене', project: 'shop', status: 'ready' },
  { _id: '2', title: 'Экспорт CSV', project: 'crm', status: 'review' },
];

describe('Board', () => {
  beforeEach(() => {
    vi.mocked(api.fetchTasks).mockResolvedValue(tasks);
  });

  it('показывает колонки по статусам и карточки в них', async () => {
    render(<Board onUnauthorized={() => {}} />);

    expect(await screen.findByText('Фильтр по цене')).toBeTruthy();
    expect(screen.getByText('Экспорт CSV')).toBeTruthy();
    expect(screen.getByText('Готово к работе')).toBeTruthy();
    expect(screen.getByText('На проверке')).toBeTruthy();
  });

  it('вызывает onUnauthorized при 401', async () => {
    const error = Object.assign(new Error('Нужна авторизация'), { status: 401 });
    vi.mocked(api.fetchTasks).mockRejectedValue(error);
    const onUnauthorized = vi.fn();

    render(<Board onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });
});
