import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppHeader from './AppHeader.jsx';

describe('AppHeader', () => {
  it('показывает логотип и название приложения', () => {
    render(<AppHeader />);
    expect(screen.getByText('MyTracker')).toBeTruthy();
    expect(screen.getByLabelText('Логотип MyTracker')).toBeTruthy();
  });

  it('рендерит переданные действия справа', () => {
    render(<AppHeader><button type="button">Действие</button></AppHeader>);
    expect(screen.getByText('Действие')).toBeTruthy();
  });
});
