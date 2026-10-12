import { getWebApp } from './webApp.js';

// Лёгкая вибрация после действия: 'success' | 'error' | 'warning'
export function haptic(type) {
  try {
    getWebApp()?.HapticFeedback?.notificationOccurred(type);
  } catch {
    // Вибрация необязательна, сбой не должен мешать работе
  }
}
