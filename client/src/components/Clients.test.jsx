import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Clients from './Clients.jsx';
import ClientRoute from './clients/ClientRoute.jsx';
import * as api from '../api.js';

vi.mock('../api.js');

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/clients" element={<Clients />}>
          <Route path="new" element={<ClientRoute />} />
          <Route path=":id" element={<ClientRoute />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

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
    renderAt('/clients');

    expect(await screen.findByText('Иван')).toBeTruthy();
    expect(screen.getByText('Магазин')).toBeTruthy();
    expect(screen.getByText(/проектов: 1/)).toBeTruthy();
    expect(screen.getByText(/\$1\.50/)).toBeTruthy();
  });

  it('показывает подсказку, если клиентов нет', async () => {
    vi.mocked(api.fetchClients).mockResolvedValue([]);
    renderAt('/clients');

    expect(await screen.findByText(/Клиентов пока нет/)).toBeTruthy();
  });

  it('по адресу /clients/:id открывает форму редактирования клиента', async () => {
    renderAt('/clients/c1');

    expect(await screen.findByText('Редактирование клиента')).toBeTruthy();
  });

  it('для неизвестного id сообщает, что клиент не найден', async () => {
    renderAt('/clients/nope');

    expect(await screen.findByText('Клиент не найден')).toBeTruthy();
  });
});
