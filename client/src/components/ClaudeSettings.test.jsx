import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClaudeSettings from './ClaudeSettings.jsx';
import { fetchClaude, saveClaude, deleteClaude } from '../api.js';

vi.mock('../api.js', () => ({
  fetchClaude: vi.fn(),
  saveClaude: vi.fn(),
  deleteClaude: vi.fn(),
}));

const OFF = { connected: false, label: '', type: '' };
const ON = { connected: true, label: 'Второй аккаунт', type: 'api_key' };

describe('Настройки: Claude', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchClaude.mockResolvedValue(OFF);
  });

  it('до заполнения метки и ключа кнопка недоступна', async () => {
    render(<ClaudeSettings />);
    const button = await screen.findByRole('button', { name: 'Сменить аккаунт' });
    expect(button.disabled).toBe(true);
    expect(screen.getByText('Аккаунт сервера')).toBeTruthy();
  });

  it('сохраняет метку, тип и ключ, после сохранения очищает поля и показывает метку', async () => {
    saveClaude.mockResolvedValue(ON);
    render(<ClaudeSettings />);

    fireEvent.change(await screen.findByPlaceholderText('Например, «Второй аккаунт»'), { target: { value: 'Второй аккаунт' } });
    fireEvent.change(screen.getByPlaceholderText('sk-ant-…'), { target: { value: 'sk-ant-abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сменить аккаунт' }));

    await waitFor(() => expect(saveClaude).toHaveBeenCalledWith({ token: 'sk-ant-abc', type: 'api_key', label: 'Второй аккаунт' }));
    expect(await screen.findByText('Подключён: Второй аккаунт')).toBeTruthy();
    expect(screen.getByPlaceholderText('Например, «Второй аккаунт»').value).toBe('');
  });

  it('показывает ошибку сервера и не считает аккаунт подключённым', async () => {
    saveClaude.mockRejectedValue(new Error('Укажите метку аккаунта'));
    render(<ClaudeSettings />);

    fireEvent.change(await screen.findByPlaceholderText('Например, «Второй аккаунт»'), { target: { value: 'x' } });
    fireEvent.change(screen.getByPlaceholderText('sk-ant-…'), { target: { value: 'sk-ant-abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сменить аккаунт' }));

    expect(await screen.findByText('Укажите метку аккаунта')).toBeTruthy();
    expect(screen.getByText('Аккаунт сервера')).toBeTruthy();
  });

  it('отключение просит подтверждение и возвращает аккаунт сервера', async () => {
    fetchClaude.mockResolvedValue(ON);
    deleteClaude.mockResolvedValue(OFF);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ClaudeSettings />);

    fireEvent.click(await screen.findByRole('button', { name: 'Отключить' }));

    await waitFor(() => expect(deleteClaude).toHaveBeenCalled());
    expect(await screen.findByText('Аккаунт сервера')).toBeTruthy();
  });
});
