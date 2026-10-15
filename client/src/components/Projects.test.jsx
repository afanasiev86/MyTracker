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
    vi.mocked(api.fetchGithubRepos).mockResolvedValue({ enabled: false, repos: [] });
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

  it('без токена GitHub не показывает кнопку синхронизации', async () => {
    vi.mocked(api.fetchClients).mockResolvedValue([]);
    vi.mocked(api.fetchProjects).mockResolvedValue([
      { _id: 'p1', slug: 'shop-api', name: 'Магазин', status: 'active', repoUrl: 'git@github.com:o/shop.git', stats: { tasks: 0, open: 0, costUsd: 0 } },
    ]);
    renderAt('/projects/p1');

    await screen.findByLabelText('Код проекта');
    expect(screen.queryByRole('button', { name: 'Синхронизировать с GitHub' })).toBeNull();
  });

  it('с токеном GitHub у проекта со ссылкой есть кнопка синхронизации, она вызывает сервер', async () => {
    vi.mocked(api.fetchClients).mockResolvedValue([]);
    vi.mocked(api.fetchGithubRepos).mockResolvedValue({ enabled: true, repos: [] });
    vi.mocked(api.syncProjectGithub).mockResolvedValue({ _id: 'p1', github: { status: 'synced' } });
    vi.mocked(api.fetchProjects).mockResolvedValue([
      { _id: 'p1', slug: 'shop-api', name: 'Магазин', status: 'active', repoUrl: 'git@github.com:o/shop.git', stats: { tasks: 0, open: 0, costUsd: 0 } },
    ]);
    renderAt('/projects/p1');

    await screen.findByLabelText('Код проекта');
    fireEvent.click(await screen.findByText('Синхронизировать с GitHub', {}, { timeout: 5000 }));

    await waitFor(() => expect(api.syncProjectGithub).toHaveBeenCalledWith('p1'));
  });

  it('для неизвестного id сообщает, что проект не найден', async () => {
    renderAt('/projects/nope');

    expect(await screen.findByText('Проект не найден')).toBeTruthy();
  });
});
