import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClaudeSettings from './ClaudeSettings.jsx';
import { fetchClaude, saveClaude, deleteClaude, startClaudeLogin, finishClaudeLogin, cancelClaudeLogin } from '../api.js';

vi.mock('../api.js', () => ({
  fetchClaude: vi.fn(),
  saveClaude: vi.fn(),
  deleteClaude: vi.fn(),
  startClaudeLogin: vi.fn(),
  finishClaudeLogin: vi.fn(),
  cancelClaudeLogin: vi.fn(),
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

  describe('вход через подписку', () => {
    const URL = 'https://claude.com/cai/oauth/authorize?code=true&state=abc';

    async function startLogin() {
      startClaudeLogin.mockResolvedValue({ url: URL });
      render(<ClaudeSettings />);
      fireEvent.click(await screen.findByRole('button', { name: 'Войти через подписку' }));
      return screen.findByRole('link', { name: 'Открыть страницу входа' });
    }

    it('по кнопке показывает ссылку на страницу входа, открывающуюся в новой вкладке', async () => {
      const link = await startLogin();

      expect(link.getAttribute('href')).toBe(URL);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(screen.getByRole('button', { name: 'Завершить вход' }).disabled).toBe(true);
    });

    it('отправляет код и метку, после успеха показывает подключённый аккаунт и прячет шаги входа', async () => {
      finishClaudeLogin.mockResolvedValue({ connected: true, label: 'Подписка Pro', type: 'oauth_token' });
      await startLogin();

      fireEvent.change(screen.getByPlaceholderText('Вставьте код'), { target: { value: ' CODE#STATE ' } });
      fireEvent.click(screen.getByRole('button', { name: 'Завершить вход' }));

      await waitFor(() => expect(finishClaudeLogin).toHaveBeenCalledWith({ code: 'CODE#STATE', label: 'Подписка Pro' }));
      expect(await screen.findByText('Подключён: Подписка Pro')).toBeTruthy();
      expect(screen.queryByRole('link', { name: 'Открыть страницу входа' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Войти через подписку' })).toBeTruthy();
    });

    it('ошибка сервера показывается, а шаги входа остаются, чтобы поправить код', async () => {
      finishClaudeLogin.mockRejectedValue(new Error('Вход не удался: OAuth error'));
      await startLogin();

      fireEvent.change(screen.getByPlaceholderText('Вставьте код'), { target: { value: 'bad' } });
      fireEvent.click(screen.getByRole('button', { name: 'Завершить вход' }));

      expect(await screen.findByText('Вход не удался: OAuth error')).toBeTruthy();
      expect(screen.getByText('Аккаунт сервера')).toBeTruthy();
      expect(screen.getByPlaceholderText('Вставьте код').value).toBe('bad');
    });

    it('отмена закрывает вход на сервере и возвращает кнопку «Войти через подписку»', async () => {
      cancelClaudeLogin.mockResolvedValue(null);
      await startLogin();

      fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));

      await waitFor(() => expect(cancelClaudeLogin).toHaveBeenCalled());
      expect(await screen.findByRole('button', { name: 'Войти через подписку' })).toBeTruthy();
    });

    it('если сервер не смог начать вход, показывает причину и ссылки нет', async () => {
      startClaudeLogin.mockRejectedValue(new Error('На сервере нет утилиты script'));
      render(<ClaudeSettings />);

      fireEvent.click(await screen.findByRole('button', { name: 'Войти через подписку' }));

      expect(await screen.findByText('На сервере нет утилиты script')).toBeTruthy();
      expect(screen.queryByRole('link', { name: 'Открыть страницу входа' })).toBeNull();
    });
  });
});
