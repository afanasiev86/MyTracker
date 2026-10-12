import { useEffect } from 'react';
import { setBackButton } from '../../lib/telegram.js';

// В Telegram «Назад» закрывает открытую задачу или форму (сбрасывает view в null)
export function useBackButton(view, setView) {
  useEffect(() => {
    if (!view) return setBackButton(null);
    return setBackButton(() => setView(null));
  }, [view, setView]);
}
