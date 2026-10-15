import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StandBlock from './StandBlock.jsx';

describe('StandBlock', () => {
  it('готовый стенд: ссылка на адрес и коммит', () => {
    render(<StandBlock stand={{ status: 'ready', url: 'https://shop.example.com', commit: 'abc1234', builtAt: '2026-10-16T10:00:00Z' }} />);

    const link = screen.getByRole('link', { name: /shop\.example\.com/ });
    expect(link.getAttribute('href')).toBe('https://shop.example.com');
    expect(screen.getByText(/Коммит abc1234/)).toBeTruthy();
  });

  it('сборка идёт: сообщает, что стенд собирается', () => {
    render(<StandBlock stand={{ status: 'building', url: 'https://shop.example.com' }} />);

    expect(screen.getByText('Стенд UAT собирается')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('не собрался: причина в тексте', () => {
    render(<StandBlock stand={{ status: 'failed', error: 'Приложение стенда не ответило на /api/health' }} />);

    expect(screen.getByText('Стенд UAT не собрался')).toBeTruthy();
    expect(screen.getByText(/не ответило на \/api\/health/)).toBeTruthy();
  });

  it('стенда нет (проект пушит сразу в ПРОД или UAT выключен): ничего не показывает', () => {
    const { container } = render(<StandBlock stand={null} />);
    expect(container.textContent).toBe('');
  });
});
