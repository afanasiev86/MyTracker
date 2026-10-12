import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Clients from './Clients.jsx';
import * as api from '../api.js';

vi.mock('../api.js');

describe('Clients', () => {
  beforeEach(() => {
    vi.mocked(api.fetchClients).mockResolvedValue([
      {
        _id: 'c1',
        name: 'Иван',
        company: 'ООО Ромашка',
        rate: { kind: 'hourly', amount: 2000, currency: 'RUB' },
        projects: [{ _id: 'p1', slug: 'shop', name: 'Магазин', status: 'active' }],
        costUsd: 1.5,
      },
    ]);
  });

  it('показывает клиента, его проекты и затраты', async () => {
    render(<Clients onUnauthorized={() => {}} />);

    expect(await screen.findByText('Иван')).toBeTruthy();
    expect(screen.getByText('Магазин')).toBeTruthy();
    expect(screen.getByText(/проектов: 1/)).toBeTruthy();
    expect(screen.getByText(/\$1\.50/)).toBeTruthy();
  });

  it('показывает подсказку, если клиентов нет', async () => {
    vi.mocked(api.fetchClients).mockResolvedValue([]);
    render(<Clients onUnauthorized={() => {}} />);

    expect(await screen.findByText('Клиентов пока нет.')).toBeTruthy();
  });
});
