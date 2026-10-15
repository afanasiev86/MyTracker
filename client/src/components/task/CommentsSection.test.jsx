import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommentsSection from './CommentsSection.jsx';

const comments = [
  { author: 'owner', text: 'Самый старый', createdAt: '2026-10-01T10:00:00Z' },
  { author: 'client', text: 'Средний', createdAt: '2026-10-02T10:00:00Z' },
  { author: 'owner', text: 'Самый новый', createdAt: '2026-10-03T10:00:00Z' },
];

describe('CommentsSection', () => {
  it('показывает самые новые комментарии сверху, самые старые — снизу', async () => {
    render(<CommentsSection comments={comments} busy={false} onAdd={vi.fn()} />);

    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toContain('Самый новый');
    expect(items[1].textContent).toContain('Средний');
    expect(items[2].textContent).toContain('Самый старый');
  });

  it('поле ввода нового комментария находится над списком комментариев', () => {
    render(<CommentsSection comments={comments} busy={false} onAdd={vi.fn()} />);

    const input = screen.getByLabelText('Новый комментарий');
    const firstComment = screen.getAllByRole('listitem')[0];
    expect(input.compareDocumentPosition(firstComment) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
