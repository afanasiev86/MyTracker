import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Health from './Health.jsx';
import { fetchHealthDetails } from '../api.js';

vi.mock('../api.js', () => ({
  fetchHealthDetails: vi.fn(),
}));

const DETAILS = {
  checks: {
    ok: false,
    mongo: { ok: true },
    claude: { ok: true, version: '1.0.0' },
    storage: { ok: false, error: 'нет ответа' },
    telegram: { enabled: false, ok: true },
  },
  process: { startedAt: '2026-10-12T00:00:00Z', uptimeSec: 3900, rssMb: 120 },
  worker: { queues: {}, runningProcesses: 1 },
  sessions: { inProgress: 1, waitingForAnswer: 2, stale: 1 },
};

describe('Состояние сервисов', () => {
  beforeEach(() => {
    fetchHealthDetails.mockReset();
  });

  it('показывает, какие сервисы в норме, а какие с проблемой', async () => {
    fetchHealthDetails.mockResolvedValue(DETAILS);
    render(<Health />);
    expect(await screen.findByText(/Хранилище вложений/)).toBeTruthy();
    expect(screen.getByText(/нет ответа/)).toBeTruthy();
    expect(screen.getAllByText('в норме').length).toBe(3);
    expect(screen.getByText('проблема')).toBeTruthy();
  });

  it('сообщает о зависших запусках и ждущих ответа', async () => {
    fetchHealthDetails.mockResolvedValue(DETAILS);
    render(<Health />);
    expect(await screen.findByText(/Без процесса \(зависли\): 1/)).toBeTruthy();
    expect(screen.getByText(/ждут ответа 2/)).toBeTruthy();
  });

  it('при ошибке показывает текст ошибки вместо пустого экрана', async () => {
    fetchHealthDetails.mockRejectedValue(new Error('Нет связи с сервером. Проверьте интернет.'));
    render(<Health />);
    expect(await screen.findByText(/Нет связи с сервером/)).toBeTruthy();
  });
});
