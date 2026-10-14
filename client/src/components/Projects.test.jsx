import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Projects from './Projects.jsx';
import ProjectRoute from './projects/ProjectRoute.jsx';
import * as api from '../api.js';

vi.mock('../api.js');

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/projects" element={<Projects />}>
          <Route path="new" element={<ProjectRoute />} />
          <Route path=":id" element={<ProjectRoute />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

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
    renderAt('/projects');

    expect(await screen.findByText('Магазин')).toBeTruthy();
    expect(screen.getByText(/На паузе/)).toBeTruthy();
    expect(screen.getByText(/Иван/)).toBeTruthy();
    expect(screen.getByText(/Задач: 3, открыто 2/)).toBeTruthy();
  });

  it('по адресу /projects/:id открывает форму редактирования проекта', async () => {
    vi.mocked(api.fetchClients).mockResolvedValue([]);
    renderAt('/projects/p1');

    expect(await screen.findByText('Редактирование проекта')).toBeTruthy();
  });

  it('по адресу /projects/new открывает форму нового проекта', async () => {
    vi.mocked(api.fetchClients).mockResolvedValue([]);
    renderAt('/projects/new');

    expect(await screen.findByText('Новый проект', { selector: 'h4' })).toBeTruthy();
  });

  it('в форме нового проекта нет поля кода, а запрос уходит без slug', async () => {
    vi.mocked(api.fetchClients).mockResolvedValue([]);
    vi.mocked(api.createProject).mockResolvedValue({ _id: 'p2', slug: 'novyy', repo: { status: 'none' } });
    renderAt('/projects/new');

    await screen.findByText('Новый проект', { selector: 'h4' });
    expect(screen.queryByLabelText('Код проекта')).toBeNull();
    fireEvent.change(screen.getByLabelText(/Название/), { target: { value: 'Новый' } });
    fireEvent.click(screen.getByRole('button', { name: 'Создать проект' }));

    await waitFor(() => expect(api.createProject).toHaveBeenCalled());
    expect(vi.mocked(api.createProject).mock.calls[0][0]).not.toHaveProperty('slug');
  });

  it('у существующего проекта код показан и недоступен для правки', async () => {
    vi.mocked(api.fetchClients).mockResolvedValue([]);
    renderAt('/projects/p1');

    const field = await screen.findByLabelText('Код проекта');
    expect(field.value).toBe('shop-api');
    expect(field.disabled).toBe(true);
  });

  it('для неизвестного id сообщает, что проект не найден', async () => {
    renderAt('/projects/nope');

    expect(await screen.findByText('Проект не найден')).toBeTruthy();
  });
});
