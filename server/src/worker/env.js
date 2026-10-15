import { fileURLToPath } from 'node:url';
import { getGithubToken } from '../services/github/settings.js';
import { getClaudeCredential } from '../services/claude/settings.js';
import { SECRET_ENV_KEYS } from '../config.js';

// Скрипт, который отдаёт git токен GitHub (deploy/git-askpass.sh рядом с сервером)
export const GIT_ASKPASS_SCRIPT = fileURLToPath(new URL('../../../deploy/git-askpass.sh', import.meta.url));

// Окружение для процесса git: без секретов сервера (childEnv). Запросы пароля в терминале отключены (на сервере его нет).
// Если токен GitHub задан (в «Настройках» или GITHUB_TOKEN), git получает его через GIT_ASKPASS для https://github.com:
// так работают клонирование и push без SSH-ключа сервера. В адрес и в аргументы токен не попадает.
// base, token, host можно подменить в тестах.
export function gitEnv({ base = childEnv(), token = getGithubToken(), host = 'github.com' } = {}) {
  const env = { ...base, GIT_TERMINAL_PROMPT: '0' };
  if (token) {
    env.GIT_ASKPASS = GIT_ASKPASS_SCRIPT;
    env.MT_GIT_TOKEN = token;
    env.MT_GIT_HOST = host;
  }
  return env;
}

// Окружение для Claude, проверок проекта (npm test, lint) и git: без секретов сервера (база, JWT, пароль входа,
// токены Telegram и GitHub). Claude умеет читать файлы (в том числе /proc/self/environ), а проверки запускают код проекта.
// Токен GitHub для git добавляет gitEnv отдельно, только процессу git.
const INTERNAL_KEYS = ['MT_GIT_TOKEN', 'MT_GIT_HOST', 'GIT_ASKPASS'];
export function childEnv(base = process.env) {
  const env = { ...base };
  for (const key of [...SECRET_ENV_KEYS, ...INTERNAL_KEYS]) delete env[key];
  return env;
}

// Окружение для процесса claude: если в «Настройках» задан свой ключ/токен, он заменяет аккаунт, залогиненный
// на сервере (так можно переключиться на другой аккаунт при лимите без доступа к серверу). Без сохранённого
// аккаунта окружение не меняется — claude работает как обычно, под аккаунтом сервера.
const CLAUDE_TOKEN_ENV_KEY = { api_key: 'ANTHROPIC_API_KEY', oauth_token: 'CLAUDE_CODE_OAUTH_TOKEN' };
export function claudeEnv(base = childEnv(), credential = getClaudeCredential()) {
  const env = { ...base };
  if (!credential) return env;
  delete env.ANTHROPIC_API_KEY;
  delete env.CLAUDE_CODE_OAUTH_TOKEN;
  env[CLAUDE_TOKEN_ENV_KEY[credential.type]] = credential.token;
  return env;
}

// Подсказка, если git не смог войти в GitHub: так владелец сразу видит, что чинить
const ACCESS_ERROR = /could not read (Username|Password)|Authentication failed|terminal prompts disabled|Permission denied \(publickey\)|Invalid username or password|Write access to repository not granted|Support for password authentication was removed/i;
export function gitAccessHint(text) {
  return ACCESS_ERROR.test(String(text))
    ? ' Нет доступа к GitHub: проверьте токен в «Настройках» → «GitHub» (нужны права Contents на запись) или ключ сервера для адреса git@github.com.'
    : '';
}
