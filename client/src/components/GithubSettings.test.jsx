import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GithubSettings from './GithubSettings.jsx';
import { fetchGithub, saveGithub, deleteGithub } from '../api.js';

vi.mock('../api.js', () => ({
  fetchGithub: vi.fn(),
  saveGithub: vi.fn(),
  deleteGithub: vi.fn(),
}));

const OFF = { connected: false, login: '', source: 'none' };
const ON = { connected: true, login: 'afanasiev86', source: 'ui' };

describe('Настройки: GitHub', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchGithub.mockResolvedValue(OFF);
  });

  it('до ввода токена кнопка недоступна', async () => {
    render(<GithubSettings />);
    const button = await screen.findByRole('button', { name: 'Проверить и сохранить' });
    expect(button.disabled).toBe(true);
    expect(screen.getByText('Не подключён')).toBeTruthy();
  });

  it('отправляет токен без пробелов и после сохранения очищает поле и показывает логин', async () => {
    saveGithub.mockResolvedValue(ON);
    render(<GithubSettings />);

    const input = await screen.findByPlaceholderText('github_pat_…');
    fireEvent.change(input, { target: { value: '  github_pat_abc  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Проверить и сохранить' }));

    await waitFor(() => expect(saveGithub).toHaveBeenCalledWith('github_pat_abc'));
    expect(await screen.findByText('Подключён afanasiev86')).toBeTruthy();
    expect(screen.getByPlaceholderText(/Токен сохранён/).value).toBe('');
  });

  it('показывает ошибку GitHub и не считает токен сохранённым', async () => {
    saveGithub.mockRejectedValue(new Error('GitHub не принял токен. Проверьте, что он скопирован целиком и не истёк.'));
    render(<GithubSettings />);

    fireEvent.change(await screen.findByPlaceholderText('github_pat_…'), { target: { value: 'github_pat_bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Проверить и сохранить' }));

    expect(await screen.findByText(/GitHub не принял токен/)).toBeTruthy();
    expect(screen.getByText('Не подключён')).toBeTruthy();
  });

  it('токен из окружения показывает пояснение и не предлагает отключить', async () => {
    fetchGithub.mockResolvedValue({ connected: true, login: '', source: 'env' });
    render(<GithubSettings />);

    expect(await screen.findByText(/переменной окружения/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Отключить' })).toBeNull();
  });

  it('отключение просит подтверждение и обновляет состояние', async () => {
    fetchGithub.mockResolvedValue(ON);
    deleteGithub.mockResolvedValue(OFF);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<GithubSettings />);

    fireEvent.click(await screen.findByRole('button', { name: 'Отключить' }));

    await waitFor(() => expect(deleteGithub).toHaveBeenCalled());
    expect(await screen.findByText('Не подключён')).toBeTruthy();
  });
});
