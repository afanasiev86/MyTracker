import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Portal from './Portal.jsx';
import * as api from '../api.js';

vi.mock('../api.js');

const TASKS = [
  {
    id: 't1',
    project: 'Магазин',
    title: 'Форма заказа',
    goal: 'Сделать форму',
    acceptance: ['Отправляется'],
    statusLabel: 'На проверке',
    dueDate: null,
    updatedAt: '2026-10-01',
    comments: [{ author: 'client', text: 'Когда готово?', createdAt: '2026-10-02' }],
  },
];

describe('Portal', () => {
  beforeEach(() => {
    vi.mocked(api.fetchPortalMe).mockResolvedValue({ name: 'Анна' });
    vi.mocked(api.fetchPortalTasks).mockResolvedValue(TASKS);
    vi.mocked(api.postPortalComment).mockResolvedValue({ ok: true });
  });

  it('показывает задачи проекта, понятный статус и комментарии', async () => {
    render(<Portal />);
    expect(await screen.findByText('Форма заказа')).toBeTruthy();
    expect(screen.getByText('На проверке')).toBeTruthy();
    expect(screen.getByText('Когда готово?')).toBeTruthy();
    expect(screen.getByText('Здравствуйте, Анна')).toBeTruthy();
  });

  it('отправляет комментарий заказчика к задаче', async () => {
    render(<Portal />);
    const box = await screen.findByLabelText('Ваш комментарий');
    fireEvent.change(box, { target: { value: 'Спасибо!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    await waitFor(() => expect(api.postPortalComment).toHaveBeenCalledWith('t1', 'Спасибо!'));
  });

  it('пустой портал объясняет, что делать дальше', async () => {
    vi.mocked(api.fetchPortalTasks).mockResolvedValue([]);
    render(<Portal />);
    expect(await screen.findByText(/Задач пока нет/)).toBeTruthy();
  });
});
