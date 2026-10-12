import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TelegramSettings from './TelegramSettings.jsx';
import { fetchTelegram, saveTelegram, deleteTelegram } from '../api.js';

vi.mock('../api.js', () => ({
  fetchTelegram: vi.fn(),
  saveTelegram: vi.fn(),
  deleteTelegram: vi.fn(),
}));

const OFF = { connected: false, hasToken: false, ownerId: '', miniAppUrl: '', botUsername: '', source: 'none' };
const ON = { connected: true, hasToken: true, ownerId: '42', miniAppUrl: '', botUsername: 'my_bot', source: 'ui' };

describe('Настройки: Telegram-бот', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchTelegram.mockResolvedValue(OFF);
  });

  it('до подключения кнопка недоступна, пока не введены токен и ID', async () => {
    render(<TelegramSettings />);
    const button = await screen.findByRole('button', { name: 'Сохранить и подключить' });
    expect(button.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Токен бота'), { target: { value: '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw' } });
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Ваш Telegram ID'), { target: { value: '42' } });
    expect(button.disabled).toBe(false);
  });

  it('отправляет введённые значения и показывает, что бот подключён', async () => {
    saveTelegram.mockResolvedValue({ ...ON, ownerReachable: true });
    render(<TelegramSettings />);

    fireEvent.change(await screen.findByLabelText('Токен бота'), { target: { value: '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw' } });
    fireEvent.change(screen.getByLabelText('Ваш Telegram ID'), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить и подключить' }));

    await waitFor(() => expect(saveTelegram).toHaveBeenCalledWith({
      botToken: '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw',
      ownerId: '42',
      miniAppUrl: '',
    }));
    expect(await screen.findByText('Подключён @my_bot')).toBeTruthy();
    expect(await screen.findByText(/Он отправил вам сообщение/)).toBeTruthy();
    expect(screen.getByLabelText('Токен бота').value).toBe('');
  });

  it('у подключённого бота токен не показывается, а менять другие поля можно без него', async () => {
    fetchTelegram.mockResolvedValue(ON);
    saveTelegram.mockResolvedValue({ ...ON, ownerReachable: true });
    render(<TelegramSettings />);

    const token = await screen.findByLabelText('Токен бота');
    expect(token.value).toBe('');
    expect(token.placeholder).toMatch(/Токен сохранён/);
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить и подключить' }));

    await waitFor(() => expect(saveTelegram).toHaveBeenCalledWith({ botToken: '', ownerId: '42', miniAppUrl: '' }));
  });

  it('предупреждает, если бот не смог написать владельцу', async () => {
    fetchTelegram.mockResolvedValue(ON);
    saveTelegram.mockResolvedValue({ ...ON, ownerReachable: false });
    render(<TelegramSettings />);

    fireEvent.click(await screen.findByRole('button', { name: 'Сохранить и подключить' }));

    expect(await screen.findByText('Настройки сохранены, но бот не смог вам написать')).toBeTruthy();
  });

  it('показывает ошибку сервера, например неверный токен', async () => {
    saveTelegram.mockRejectedValue(new Error('Telegram не принял токен. Скопируйте его из @BotFather целиком.'));
    render(<TelegramSettings />);

    fireEvent.change(await screen.findByLabelText('Токен бота'), { target: { value: '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw' } });
    fireEvent.change(screen.getByLabelText('Ваш Telegram ID'), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить и подключить' }));

    expect(await screen.findByText(/Telegram не принял токен/)).toBeTruthy();
  });

  it('отключает бота после подтверждения', async () => {
    fetchTelegram.mockResolvedValue(ON);
    deleteTelegram.mockResolvedValue(OFF);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<TelegramSettings />);

    fireEvent.click(await screen.findByRole('button', { name: 'Отключить' }));

    await waitFor(() => expect(deleteTelegram).toHaveBeenCalled());
    expect(await screen.findByText('Не подключён')).toBeTruthy();
  });
});
