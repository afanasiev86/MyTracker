import { useEffect } from 'react';
import { setBackButton } from '../../lib/telegram/backButton.js';

// В Telegram «Назад» закрывает открытую задачу или форму
export function useBackButton(open, onBack) {
  useEffect(() => {
    if (!open) return setBackButton(null);
    return setBackButton(onBack);
  }, [open, onBack]);
}
