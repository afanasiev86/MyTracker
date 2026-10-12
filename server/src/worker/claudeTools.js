import { fileURLToPath } from 'node:url';

// Скрипт для вызовов API трекера (deploy/tracker-api.sh рядом с сервером)
export const TRACKER_CLI = fileURLToPath(new URL('../../../deploy/tracker-api.sh', import.meta.url));

// Инструменты, которые Claude может использовать без подтверждения.
// Нет curl и npx: сеть доступна только через скрипт трекера и npm для нужных команд.
export function claudeTools() {
  return [
    'Read', 'Edit', 'Write',
    'Bash(git *)',
    'Bash(npm test*)', 'Bash(npm run lint*)', 'Bash(npm run build*)',
    'Bash(npm ci*)', 'Bash(npm install*)',
    `Bash(${TRACKER_CLI} *)`,
  ].join(' ');
}
