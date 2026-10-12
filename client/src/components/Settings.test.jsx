import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Settings from './Settings.jsx';
import { fetchStorage, saveStorage } from '../api.js';

vi.mock('../api.js', () => ({
  fetchStorage: vi.fn(),
  saveStorage: vi.fn(),
}));

const STATE = {
  active: 'minio',
  providers: [
    { id: 'minio', label: 'MinIO (свой сервер)', configured: true, bucket: 'mytracker-attachments' },
    { id: 's3', label: 'S3 в облаке reg.ru', configured: false, bucket: 'mytracker-attachments' },
  ],
};

describe('Настройки: хранилище', () => {
  beforeEach(() => {
    fetchStorage.mockResolvedValue(STATE);
    saveStorage.mockReset();
  });

  it('показывает активный провайдер и отключает ненастроенный', async () => {
    render(<Settings />);
    const minio = await screen.findByRole('radio', { name: /MinIO/ });
    const s3 = screen.getByRole('radio', { name: /reg\.ru/ });
    expect(minio.checked).toBe(true);
    expect(s3.disabled).toBe(true);
    expect(screen.getByText(/не настроено/)).toBeTruthy();
  });

  it('сохраняет выбор через API', async () => {
    saveStorage.mockResolvedValue({ ...STATE, active: 's3' });
    fetchStorage.mockResolvedValue({
      ...STATE,
      providers: STATE.providers.map((p) => ({ ...p, configured: true })),
    });
    render(<Settings />);
    const s3 = await screen.findByRole('radio', { name: /reg\.ru/ });
    fireEvent.click(s3);
    await waitFor(() => expect(saveStorage).toHaveBeenCalledWith('s3'));
  });
});
