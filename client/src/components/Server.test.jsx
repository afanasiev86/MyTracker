import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Server from './Server.jsx';
import { fetchOps, controlService, fetchServiceLogs, startDeploy } from '../api.js';

vi.mock('../api.js', () => ({
  fetchOps: vi.fn(),
  controlService: vi.fn(),
  fetchServiceLogs: vi.fn(),
  startDeploy: vi.fn(),
}));

const GB = 1024 ** 3;
const STATE = {
  available: true,
  metrics: {
    uptimeSec: 3 * 86400,
    cpu: { cores: 2, load: [0.4, 0.3, 0.2], percent: 20 },
    memory: { total: 4 * GB, used: 1 * GB, percent: 25 },
    disk: { total: 40 * GB, used: 38 * GB, percent: 95 },
  },
  services: [
    { id: 'nginx', label: 'nginx', actions: ['restart', 'start', 'stop'], status: 'active' },
    { id: 'mongo', label: 'MongoDB', actions: ['restart', 'start', 'stop'], status: 'inactive' },
    { id: 'docker', label: 'Docker', actions: [], status: 'active' },
  ],
  deploy: { commit: 'abc1234', running: false, last: { ok: false, message: 'Версия def5678 не запустилась. Возвращена версия abc1234.', finishedAt: '2026-10-12T10:00:00Z' } },
};

describe('Раздел «Сервер»', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchOps.mockResolvedValue(STATE);
  });

  it('показывает ресурсы, сервисы и итог прошлого обновления', async () => {
    render(<Server />);
    expect(await screen.findByText('Ресурсы')).toBeTruthy();
    expect(screen.getByText('1.0 из 4.0 ГБ')).toBeTruthy();
    expect(screen.getByText('38.0 из 40.0 ГБ')).toBeTruthy();
    expect(screen.getByText('MongoDB')).toBeTruthy();
    expect(screen.getByText('остановлен')).toBeTruthy();
    expect(screen.getByText('версия abc1234')).toBeTruthy();
    expect(screen.getByText(/Возвращена версия abc1234/)).toBeTruthy();
  });

  it('предлагает действия по состоянию: у работающего нет «Запустить», у остановленного есть', async () => {
    render(<Server />);
    await screen.findByText('MongoDB');
    // nginx работает: перезапуск и остановка, без запуска. MongoDB остановлена: запуск есть
    expect(screen.getAllByRole('button', { name: 'Запустить' }).length).toBe(1);
    expect(screen.getAllByRole('button', { name: 'Перезапустить' }).length).toBe(2);
    // у Docker действий нет, только журнал
    expect(screen.getAllByRole('button', { name: 'Журнал' }).length).toBe(3);
  });

  it('перезапуск требует подтверждения и только потом идёт на сервер', async () => {
    controlService.mockResolvedValue({ scheduled: false, status: 'active' });
    render(<Server />);
    await screen.findByText('MongoDB');

    fireEvent.click(screen.getAllByRole('button', { name: 'Перезапустить' })[0]);
    expect(controlService).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Подтвердить' }));

    await waitFor(() => expect(controlService).toHaveBeenCalledWith('nginx', 'restart'));
  });

  it('показывает ошибку сервера, например нехватку прав', async () => {
    controlService.mockRejectedValue(new Error('Не удалось выполнить: нет прав на sudo: выполните на сервере deploy/ops-setup.sh'));
    render(<Server />);
    await screen.findByText('MongoDB');

    fireEvent.click(screen.getAllByRole('button', { name: 'Перезапустить' })[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Подтвердить' }));

    expect(await screen.findByText(/ops-setup\.sh/)).toBeTruthy();
  });

  it('журнал открывается в окне и запрашивает выбранное число строк', async () => {
    fetchServiceLogs.mockResolvedValue({ text: 'запись журнала 1' });
    render(<Server />);
    await screen.findByText('MongoDB');

    fireEvent.click(screen.getAllByRole('button', { name: 'Журнал' })[0]);

    expect(await screen.findByText('запись журнала 1')).toBeTruthy();
    expect(fetchServiceLogs).toHaveBeenCalledWith('nginx', 50);
  });

  it('обновление запускается после подтверждения', async () => {
    startDeploy.mockResolvedValue({ started: true });
    render(<Server />);

    fireEvent.click(await screen.findByRole('button', { name: 'Обновить MyTracker' }));
    expect(startDeploy).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Обновить' }));

    await waitFor(() => expect(startDeploy).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Обновление запущено.')).toBeTruthy();
  });

  it('пока идёт обновление, кнопка недоступна', async () => {
    fetchOps.mockResolvedValue({ ...STATE, deploy: { ...STATE.deploy, running: true } });
    render(<Server />);

    const button = await screen.findByRole('button', { name: 'Обновить MyTracker' });
    expect(button.disabled).toBe(true);
    expect(screen.getByText(/Обновление идёт/)).toBeTruthy();
  });

  it('не на Linux показывает только ресурсы и объясняет почему', async () => {
    fetchOps.mockResolvedValue({ ...STATE, available: false, services: [], deploy: null });
    render(<Server />);

    expect(await screen.findByText(/доступны только на Linux-сервере/)).toBeTruthy();
    expect(screen.queryByText('Сервисы')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Обновить MyTracker' })).toBeNull();
  });
});
