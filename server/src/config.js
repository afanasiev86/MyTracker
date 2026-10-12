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
  ATTACHMENT_STORAGE: optional,
  MINIO_ENDPOINT: optional,
  MINIO_PORT: optional,
  MINIO_USE_SSL: optional,
  MINIO_ACCESS_KEY: optional,
  MINIO_SECRET_KEY: optional,
  MINIO_BUCKET: optional,
  S3_ENDPOINT: optional,
  S3_REGION: optional,
  S3_ACCESS_KEY: optional,
  S3_SECRET_KEY: optional,
  S3_BUCKET: optional,
  REPOS_DIR: optional,
  WORKTREES_DIR: optional,
  DEFAULT_BRANCH: optional,
  CLAUDE_BIN: optional,
  TRACKER_API_URL: optional,
  RUN_TIMEOUT_MIN: optional,
});

// Разбирает окружение в именованные настройки. Значения по умолчанию задаются здесь же.
export function readConfig(env = process.env) {
  const raw = schema.parse(env);
  const port = Number(raw.PORT) || 3001;
  return {
    port,
    mongoUrl: raw.MONGO_URL,
    jwtSecret: raw.JWT_SECRET,
    adminPassword: raw.ADMIN_PASSWORD,
    attachmentStorage: raw.ATTACHMENT_STORAGE,
    telegram: {
      botToken: raw.TELEGRAM_BOT_TOKEN,
      ownerId: raw.TELEGRAM_OWNER_ID,
      miniAppUrl: raw.TELEGRAM_MINIAPP_URL,
    },
    minio: {
      endpoint: raw.MINIO_ENDPOINT,
      port: raw.MINIO_PORT,
      useSsl: raw.MINIO_USE_SSL,
      accessKey: raw.MINIO_ACCESS_KEY,
      secretKey: raw.MINIO_SECRET_KEY,
      bucket: raw.MINIO_BUCKET,
    },
    s3: {
      endpoint: raw.S3_ENDPOINT,
      region: raw.S3_REGION,
      accessKey: raw.S3_ACCESS_KEY,
      secretKey: raw.S3_SECRET_KEY,
      bucket: raw.S3_BUCKET,
    },
    worker: {
      reposDir: raw.REPOS_DIR,
      worktreesDir: raw.WORKTREES_DIR,
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
