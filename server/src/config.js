import path from 'node:path';
import { z } from 'zod';

// Настройки из переменных окружения. Читаются при каждом вызове, а не один раз при загрузке модуля:
// так тесты и перезапуск с новым окружением видят актуальные значения.
// Пустая строка в окружении означает «не задано».
const optional = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional());

const schema = z.object({
  PORT: optional,
  MONGO_URL: optional,
  JWT_SECRET: optional,
  ADMIN_PASSWORD: optional,
  TELEGRAM_BOT_TOKEN: optional,
  TELEGRAM_OWNER_ID: optional,
  TELEGRAM_MINIAPP_URL: optional,
  ATTACHMENTS_DIR: optional,
  REPOS_DIR: optional,
  DEFAULT_BRANCH: optional,
  CLAUDE_BIN: optional,
  TRACKER_API_URL: optional,
  RUN_TIMEOUT_MIN: optional,
  OPS_APP_DIR: optional,
  GITHUB_TOKEN: optional,
  UAT_DOMAIN: optional,
  UAT_DIR: optional,
});

// Все переменные окружения, которые знает сервер, и среди них секреты. Секреты убираются из окружения
// Claude, проверок проекта и git (см. worker/env.js). Новая переменная с токеном, паролем или секретом
// должна попасть в SECRET_ENV_KEYS: это проверяет тест.
export const CONFIG_ENV_KEYS = Object.keys(schema.shape);
export const SECRET_ENV_KEYS = ['MONGO_URL', 'JWT_SECRET', 'ADMIN_PASSWORD', 'TELEGRAM_BOT_TOKEN', 'GITHUB_TOKEN'];

// Разбирает окружение в именованные настройки. Значения по умолчанию задаются здесь же.
export function readConfig(env = process.env) {
  const raw = schema.parse(env);
  const port = Number(raw.PORT) || 3001;
  return {
    port,
    mongoUrl: raw.MONGO_URL,
    jwtSecret: raw.JWT_SECRET,
    adminPassword: raw.ADMIN_PASSWORD,
    attachmentsDir: raw.ATTACHMENTS_DIR || path.resolve(process.cwd(), '..', 'uploads'),
    telegram: {
      botToken: raw.TELEGRAM_BOT_TOKEN,
      ownerId: raw.TELEGRAM_OWNER_ID,
      miniAppUrl: raw.TELEGRAM_MINIAPP_URL,
    },
    ops: {
      // Папка установки трекера на сервере: из неё работают docker compose, деплой и служебные файлы .ops/
      appDir: raw.OPS_APP_DIR || path.resolve(process.cwd(), '..'),
    },
    // Токен GitHub из окружения. Токен из настроек интерфейса важнее, см. services/github/settings.js
    github: { token: raw.GITHUB_TOKEN },
    // Домен UAT-стендов (<slug>.<домен>). Без него стенды выключены, см. services/uat
    uat: { domain: raw.UAT_DOMAIN, dir: raw.UAT_DIR || '/srv/uat' },
    worker: {
      reposDir: raw.REPOS_DIR,
      defaultBranch: raw.DEFAULT_BRANCH || 'main',
      claudeBin: raw.CLAUDE_BIN || 'claude',
      apiUrl: raw.TRACKER_API_URL || `http://localhost:${port}/api`,
      timeoutMin: Number(raw.RUN_TIMEOUT_MIN) || 30,
    },
  };
}

export function getConfig() {
  return readConfig();
}

// Без этих переменных сервер не запускается. Остальное — предупреждения: сервер работает, но функция отключена.
export function assertStartupConfig(cfg = getConfig()) {
  const missing = [];
  if (!cfg.mongoUrl) missing.push('MONGO_URL');
  if (!cfg.jwtSecret) missing.push('JWT_SECRET');
  if (missing.length > 0) {
    throw new Error(`Не заданы переменные окружения: ${missing.join(', ')}. См. server/.env.example`);
  }
  const warnings = [];
  if (!cfg.adminPassword) warnings.push('ADMIN_PASSWORD: вход по паролю отключён');
  if (!cfg.telegram.botToken) warnings.push('TELEGRAM_BOT_TOKEN: Telegram отключён');
  return warnings;
}
