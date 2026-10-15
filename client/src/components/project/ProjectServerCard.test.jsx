import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectServerCard from './ProjectServerCard.jsx';
import { formatBytes } from '../../lib/bytes.js';
import * as api from '../../api.js';

vi.mock('../../api.js', () => ({ fetchProjectServer: vi.fn(), startProjectStand: vi.fn() }));

const copy = { configured: true, path: '/srv/repos/modules', exists: true, sizeBytes: 512 * 1024 * 1024 };
const stand = (over = {}) => ({ enabled: true, branch: 'uat', status: 'ready', url: 'https://modules.example.com', commit: 'abc1234', error: '', runtime: { containers: 2, running: 2, memoryBytes: 700 * 1024 * 1024 }, ...over });

beforeEach(() => {
  vi.mocked(api.fetchProjectServer).mockReset();
  vi.mocked(api.startProjectStand).mockReset();
});

describe('размер для человека', () => {
  it('переводит байты в понятные единицы', () => {
    expect(formatBytes(0)).toBe('0 Б');
    expect(formatBytes(1536)).toBe('1,5 КБ');
    expect(formatBytes(512 * 1024 * 1024)).toBe('512 МБ');
    expect(formatBytes(3.5 * 1024 ** 3)).toBe('3,5 ГБ');
    expect(formatBytes(null)).toBe('—');
  });
});

describe('ProjectServerCard', () => {
  it('папка есть, стенд запущен: путь, размер, статус, ссылка и память', async () => {
    vi.mocked(api.fetchProjectServer).mockResolvedValue({ localCopy: copy, stand: stand() });
    render(<ProjectServerCard projectId="p1" />);

    expect(await screen.findByText('/srv/repos/modules')).toBeTruthy();
    expect(screen.getByText('512 МБ')).toBeTruthy();
    expect(screen.getByText('Запущен (контейнеров: 2 из 2)')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'https://modules.example.com' }).getAttribute('href')).toBe('https://modules.example.com');
    expect(screen.getByText('700 МБ')).toBeTruthy();
  });

  it('папки нет: сообщает об этом и не показывает размер', async () => {
    vi.mocked(api.fetchProjectServer).mockResolvedValue({ localCopy: { configured: true, path: '/srv/repos/modules', exists: false, sizeBytes: 0 }, stand: stand({ status: 'none', runtime: { containers: 0, running: 0, memoryBytes: 0 } }) });
    render(<ProjectServerCard projectId="p1" />);

    expect(await screen.findByText(/Нет папки/)).toBeTruthy();
    expect(screen.queryByText('Размер копии')).toBeNull();
    expect(screen.getByText('Не запускался')).toBeTruthy();
  });

  it('стенд остановлен: памяти нет', async () => {
    vi.mocked(api.fetchProjectServer).mockResolvedValue({ localCopy: copy, stand: stand({ runtime: { containers: 2, running: 0, memoryBytes: 0 } }) });
    render(<ProjectServerCard projectId="p1" />);

    expect(await screen.findByText('Остановлен')).toBeTruthy();
    expect(screen.queryByText('Память стенда')).toBeNull();
  });

  it('сборка не удалась: причина в карточке', async () => {
    vi.mocked(api.fetchProjectServer).mockResolvedValue({ localCopy: copy, stand: stand({ status: 'failed', error: 'Рецепт нарушает правила стенда', runtime: { containers: 0, running: 0, memoryBytes: 0 } }) });
    render(<ProjectServerCard projectId="p1" />);

    expect(await screen.findByText('Ошибка сборки')).toBeTruthy();
    expect(screen.getByText('Рецепт нарушает правила стенда')).toBeTruthy();
  });

  it('проект пушит сразу в ПРОД: стенда нет', async () => {
    vi.mocked(api.fetchProjectServer).mockResolvedValue({ localCopy: copy, stand: stand({ enabled: false, runtime: null }) });
    render(<ProjectServerCard projectId="p1" />);

    expect(await screen.findByText(/Нет: UAT выключен или проект пушит сразу в ПРОД/)).toBeTruthy();
  });

  it('стенд ни разу не запускался: кнопка «Запустить UAT» запускает его и обновляет состояние', async () => {
    const idle = stand({ status: 'none', runtime: { containers: 0, running: 0, memoryBytes: 0 } });
    vi.mocked(api.fetchProjectServer)
      .mockResolvedValueOnce({ localCopy: copy, stand: idle })
      .mockResolvedValue({ localCopy: copy, stand: stand({ status: 'building', runtime: { containers: 0, running: 0, memoryBytes: 0 } }) });
    vi.mocked(api.startProjectStand).mockResolvedValue({ queued: true });
    render(<ProjectServerCard projectId="p1" />);

    fireEvent.click(await screen.findByRole('button', { name: /Запустить UAT/ }));

    await waitFor(() => expect(api.startProjectStand).toHaveBeenCalledWith('p1'));
    expect(await screen.findByText('Собирается')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Запустить UAT/ })).toBeNull();
  });

  it('кнопки «Запустить UAT» нет, если стенд уже запускался', async () => {
    vi.mocked(api.fetchProjectServer).mockResolvedValue({ localCopy: copy, stand: stand() });
    render(<ProjectServerCard projectId="p1" />);

    await screen.findByText('Запущен (контейнеров: 2 из 2)');
    expect(screen.queryByRole('button', { name: /Запустить UAT/ })).toBeNull();
  });

  it('не удалось запустить: причина под кнопкой', async () => {
    vi.mocked(api.fetchProjectServer).mockResolvedValue({ localCopy: copy, stand: stand({ status: 'none', runtime: { containers: 0, running: 0, memoryBytes: 0 } }) });
    vi.mocked(api.startProjectStand).mockImplementation(async () => { throw new Error('У проекта не указан репозиторий'); });
    render(<ProjectServerCard projectId="p1" />);

    fireEvent.click(await screen.findByRole('button', { name: /Запустить UAT/ }));

    expect(await screen.findByText('У проекта не указан репозиторий')).toBeTruthy();
  });

  it('ошибка запроса показывается сообщением', async () => {
    vi.mocked(api.fetchProjectServer).mockImplementation(async () => { throw new Error('Нет связи'); });
    render(<ProjectServerCard projectId="p1" />);

    expect(await screen.findByText('Нет связи')).toBeTruthy();
  });
});
