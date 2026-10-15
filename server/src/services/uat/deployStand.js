import fs from 'node:fs/promises';
import path from 'node:path';
import { findStandProject } from '../store/projects.js';
import { ensureStand } from './ensureStand.js';
import { syncStandRepo } from './syncStandRepo.js';
import { composeExec, composeUp, readComposeConfig } from './compose.js';
import { isInitialized, markInitialized, readRecipe, recipeExists, standDir, writeStandEnv } from './standFiles.js';
import { validateCompose } from './validateCompose.js';
import { makeRecipe } from './makeRecipe.js';

// Сколько раз за одну сборку просим Claude переписать рецепт
const MAX_RECIPES = 2;
const HEALTH_ATTEMPTS = 30;
const HEALTH_PAUSE_MS = 2000;
const TAIL = 1500;

const tail = (text) => String(text).trim().slice(-TAIL);

// Журнал сборки лежит в папке стенда и каждый раз пишется заново
function openLog(dir) {
  const file = path.posix.join(dir, 'deploy.log');
  return fs.writeFile(file, '').then(() => (text) => fs.appendFile(file, `${new Date().toISOString()} ${text}\n`));
}

// Файл рецепта целиком: читается, проверяется на соответствие правилам и разворачивается docker compose.
// Возвращает { recipe } или { error } — причина годится и владельцу, и Claude.
async function checkRecipe(dir, slug, port) {
  const read = await readRecipe(dir);
  if (read.error) return read;
  const parsed = await readComposeConfig(dir, slug);
  if (parsed.error) return parsed;
  const problems = validateCompose(parsed.config, { dir, port });
  if (problems.length > 0) return { error: `Рецепт нарушает правила стенда: ${problems.join('; ')}` };
  return { recipe: read.recipe };
}

async function waitHealthy(port, healthPath) {
  let last = 'нет ответа';
  for (let attempt = 0; attempt < HEALTH_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}${healthPath}`, { signal: AbortSignal.timeout(5000), redirect: 'manual' });
      if (res.status < 500) return;
      last = `ответ ${res.status}`;
    } catch (err) {
      last = err.message;
    }
    await new Promise((resolve) => { setTimeout(resolve, HEALTH_PAUSE_MS); });
  }
  throw new Error(`Приложение стенда не ответило на ${healthPath}: ${last}`);
}

// Собирает стенд проекта из ветки UAT и запускает его. Возвращает { host, commit }, при любой неудаче бросает Error с причиной.
export async function deployStand(slug) {
  const project = await findStandProject(slug);
  if (!project?.repoUrl) throw new Error('У проекта не указан репозиторий');
  const { host, port } = await ensureStand(slug);
  const dir = standDir(slug);
  await fs.mkdir(dir, { recursive: true });
  const log = await openLog(dir);

  const commit = await syncStandRepo(dir, project);
  await log(`Ветка ${project.uatBranch || 'uat'}, коммит ${commit}`);
  await writeStandEnv(dir, { port, host });

  // Рецепт переписывается, только если его нет или он перестал работать (не проходит проверку или не собирается)
  let hint = '';
  let recipes = 0;
  for (;;) {
    if (hint || !(await recipeExists(dir))) {
      if (recipes >= MAX_RECIPES) throw new Error(hint);
      await makeRecipe({ slug, dir, hint, log });
      recipes += 1;
      hint = '';
    }
    const checked = await checkRecipe(dir, slug, port);
    if (checked.error) {
      await log(checked.error);
      hint = checked.error;
    } else {
      const up = await composeUp(dir, slug);
      await log(`docker compose up: ${up.ok ? 'готово' : 'ошибка'}\n${up.stdout}\n${up.stderr}`);
      if (up.ok) {
        if (!(await isInitialized(dir)) && checked.recipe.seed) {
          const seeded = await composeExec(dir, slug, checked.recipe.service, checked.recipe.seed);
          await log(`seed: ${seeded.ok ? 'готово' : 'ошибка'}\n${seeded.stdout}\n${seeded.stderr}`);
          if (!seeded.ok) throw new Error(`Наполнение базы не удалось: ${tail(seeded.stderr || seeded.error)}`);
        }
        await markInitialized(dir);
        await waitHealthy(port, checked.recipe.healthPath);
        return { host, commit };
      }
      hint = `Сборка или запуск не удались: ${tail(up.stderr || up.error)}`;
    }
  }
}
