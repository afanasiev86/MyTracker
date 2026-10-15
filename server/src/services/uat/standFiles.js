import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { getConfig } from '../../config.js';

// Папки стендов лежат на Linux-сервере, поэтому пути всегда с косой чертой
export const standDir = (slug) => path.posix.join(getConfig().uat.dir, slug);
export const composeFile = (dir) => path.posix.join(dir, 'compose.yml');
const RECIPE_FILE = 'stand.json';
const ENV_FILE = '.env';
const INITIALIZED_FILE = 'initialized';

const exists = (file) => fs.access(file).then(() => true, () => false);

// Рецепт стенда рядом с compose.yml: в каком сервисе приложение, что открывать для проверки, чем наполнить базу
const recipeSchema = z.object({
  service: z.string().min(1),
  healthPath: z.string().startsWith('/').default('/'),
  seed: z.array(z.string().min(1)).min(1).optional(),
});

export async function recipeExists(dir) {
  return (await exists(composeFile(dir))) && (await exists(path.posix.join(dir, RECIPE_FILE)));
}

// Возвращает { recipe } или { error } с причиной для Claude и владельца
export async function readRecipe(dir) {
  let raw;
  try {
    raw = JSON.parse(await fs.readFile(path.posix.join(dir, RECIPE_FILE), 'utf8'));
  } catch (err) {
    return { error: `Файл ${RECIPE_FILE} не прочитан: ${err.message}` };
  }
  const parsed = recipeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: `Файл ${RECIPE_FILE} неверный: ${parsed.error.issues.map((i) => `${i.path.join('.') || 'корень'}: ${i.message}`).join('; ')}` };
  }
  return { recipe: parsed.data };
}

// Переменные для compose: порт, адрес и пароли стенда. Пароли создаются один раз и не меняются: база уже хранит старые.
const SECRET_KEYS = ['STAND_SECRET_A', 'STAND_SECRET_B', 'STAND_SECRET_C'];

export async function writeStandEnv(dir, { port, host }) {
  const file = path.posix.join(dir, ENV_FILE);
  const lines = (await fs.readFile(file, 'utf8').catch(() => '')).split('\n').filter((line) => line.includes('='));
  const current = new Map(lines.map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
  const values = {
    UAT_PORT: String(port),
    STAND_HOST: host,
    STAND_URL: `https://${host}`,
    ...Object.fromEntries(SECRET_KEYS.map((key) => [key, current.get(key) || crypto.randomBytes(24).toString('hex')])),
  };
  await fs.writeFile(file, `${Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n')}\n`, { mode: 0o600 });
}

// База стенда наполняется один раз, при первом запуске: seed проектов обычно стирает данные, а дальше они живут своей жизнью
export const isInitialized = (dir) => exists(path.posix.join(dir, INITIALIZED_FILE));
export const markInitialized = (dir) => fs.writeFile(path.posix.join(dir, INITIALIZED_FILE), `${new Date().toISOString()}\n`);
