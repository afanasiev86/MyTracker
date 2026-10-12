import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Projects from './Projects.jsx';
import * as api from '../api.js';

vi.mock('../api.js');

describe('Projects', () => {
  beforeEach(() => {
    vi.mocked(api.fetchProjects).mockResolvedValue([
      {
        _id: 'p1',
        slug: 'shop-api',
        name: 'Магазин',
        status: 'paused',
        client: { _id: 'c1', name: 'Иван' },
        deadline: null,
        stats: { tasks: 3, open: 2, costUsd: 0.4 },
      },
    ]);
  });

  it('показывает проект со статусом, клиентом и счётчиками задач', async () => {
    render(<Projects />);

    expect(await screen.findByText('Магазин')).toBeTruthy();
    expect(screen.getByText(/На паузе/)).toBeTruthy();
    expect(screen.getByText(/Иван/)).toBeTruthy();
    expect(screen.getByText(/Задач: 3, открыто 2/)).toBeTruthy();
  });
});
