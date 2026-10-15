import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StandEnvViewer from './StandEnvViewer.jsx';
import * as api from '../../api.js';

vi.mock('../../api.js', () => ({ fetchStandEnv: vi.fn() }));

const env = {
  exists: true,
  path: '/srv/uat/shop/.env',
  entries: [
    { key: 'UAT_PORT', value: '4123', secret: false },
    { key: 'STAND_URL', value: 'https://shop.example.com', secret: false },
    { key: 'STAND_SECRET_A', value: 'abc123secret', secret: true },
  ],
};

beforeEach(() => {
  vi.mocked(api.fetchStandEnv).mockReset();
});

describe('StandEnvViewer', () => {
  it('файл не загружается, пока не нажали «Показать .env»', () => {
    render(<StandEnvViewer projectId="p1" />);

    expect(api.fetchStandEnv).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Показать \.env/ })).toBeTruthy();
  });

  it('показывает переменные, а пароли скрывает до явного показа', async () => {
    vi.mocked(api.fetchStandEnv).mockResolvedValue(env);
    render(<StandEnvViewer projectId="p1" />);

    fireEvent.click(screen.getByRole('button', { name: /Показать \.env/ }));

    expect(await screen.findByText('4123')).toBeTruthy();
    expect(screen.getByText('https://shop.example.com')).toBeTruthy();
    expect(screen.getByText('/srv/uat/shop/.env')).toBeTruthy();
    expect(screen.queryByText('abc123secret')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Показать STAND_SECRET_A' }));

    expect(screen.getByText('abc123secret')).toBeTruthy();
  });

  it('«Скрыть» убирает файл с экрана', async () => {
    vi.mocked(api.fetchStandEnv).mockResolvedValue(env);
    render(<StandEnvViewer projectId="p1" />);
    fireEvent.click(screen.getByRole('button', { name: /Показать \.env/ }));
    await screen.findByText('4123');

    fireEvent.click(screen.getByRole('button', { name: 'Скрыть' }));

    expect(screen.queryByText('4123')).toBeNull();
    expect(screen.getByRole('button', { name: /Показать \.env/ })).toBeTruthy();
  });

  it('файла ещё нет: сообщает, что он появится после первой сборки', async () => {
    vi.mocked(api.fetchStandEnv).mockResolvedValue({ exists: false, path: '/srv/uat/shop/.env', entries: [] });
    render(<StandEnvViewer projectId="p1" />);

    fireEvent.click(screen.getByRole('button', { name: /Показать \.env/ }));

    expect(await screen.findByText(/Файла ещё нет/)).toBeTruthy();
  });

  it('ошибка запроса показывается сообщением', async () => {
    vi.mocked(api.fetchStandEnv).mockImplementation(async () => { throw new Error('Переменные стенда видит только владелец'); });
    render(<StandEnvViewer projectId="p1" />);

    fireEvent.click(screen.getByRole('button', { name: /Показать \.env/ }));

    expect(await screen.findByText('Переменные стенда видит только владелец')).toBeTruthy();
  });
});
