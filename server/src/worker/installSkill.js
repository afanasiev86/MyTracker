import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { excludeFromGit } from './screenshots/excludeFromGit.js';

// Инструкция запуска /implement-task лежит в репозитории трекера (.claude/skills/implement-task),
// а задача идёт в репозитории проекта. Без неё Claude не находит команду, работает без плана
// и не доходит до коммита.
export const SKILL_NAME = 'implement-task';
export const SKILL_SOURCE = fileURLToPath(new URL(`../../../.claude/skills/${SKILL_NAME}`, import.meta.url));

// Кладёт инструкцию в рабочую копию, если в репозитории проекта своей нет (своя имеет приоритет).
// Папка исключена из git: в коммиты задачи инструкция не попадает. Возвращает true, если скопировали.
export async function installSkill(wt, source = SKILL_SOURCE) {
  const target = path.join(wt, '.claude', 'skills', SKILL_NAME);
  const exists = await fs.access(path.join(target, 'SKILL.md')).then(() => true, () => false);
  if (exists) return false;
  await fs.access(path.join(source, 'SKILL.md'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.cp(source, target, { recursive: true });
  await excludeFromGit(wt, `.claude/skills/${SKILL_NAME}`);
  return true;
}
