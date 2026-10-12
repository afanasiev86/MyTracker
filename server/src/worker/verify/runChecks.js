import { projectChecks } from './projectChecks.js';
import { ensureDependencies } from './ensureDependencies.js';
import { runCommand } from './runCommand.js';
import { CHECK_TIMEOUT_MS, OUTPUT_TAIL } from './config.js';

// Запускает проверки проекта в рабочей копии. Возвращает результат каждой.
// Если проверок нет, возвращает пустой список.
export async function runChecks(wt) {
  const names = await projectChecks(wt);
  if (names.length === 0) return [];
  try {
    await ensureDependencies(wt);
  } catch (err) {
    return [{ name: 'подготовка', ok: false, tail: err.message }];
  }
  const results = [];
  for (const name of names) {
    const { code, output } = await runCommand('npm', ['run', name], wt, CHECK_TIMEOUT_MS);
    results.push({ name, ok: code === 0, code, tail: output.slice(-OUTPUT_TAIL) });
  }
  return results;
}
