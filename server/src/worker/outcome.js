import { git } from './git.js';
import { isLimitError } from './limits.js';
import { countNewCommits } from './worktree.js';
import { runChecks } from './verify.js';

// Итог запуска по результату claude. Порядок условий важен: первое совпавшее определяет статус.
// Возвращает { status, summary, costUsd, log, checks? }.
export async function resolveOutcome({ res, data, question, cfg, wt, startPoint, branch, log, costUsd }) {
  if (res.reason === 'cancelled') {
    return { status: 'failed', summary: 'Запуск остановлен вручную.', costUsd, log };
  }
  if (res.reason === 'timeout') {
    return {
      status: 'failed',
      summary: `Превышено время запуска (${cfg.timeoutMin} мин). Запуск остановлен.`,
      costUsd,
      log,
    };
  }
  if (isLimitError(res.stdout) || isLimitError(res.stderr)) {
    return {
      status: 'ready',
      summary: 'Достигнут лимит Claude. Задача возвращена в «Готово к работе», запустите её позже.',
      costUsd,
      log,
    };
  }
  if (res.code !== 0 || data?.is_error) {
    return {
      status: 'failed',
      summary: data?.result || res.stderr.slice(-2000) || 'Claude завершился с ошибкой',
      costUsd,
      log,
    };
  }
  if (question) {
    // Claude ждёт ответа. Сохраняем сделанное, чтобы продолжить с того же места
    if (await countNewCommits(wt, startPoint) > 0) {
      await git(wt, ['push', '-u', 'origin', branch]);
    }
    return { status: 'waiting', summary: question, costUsd, log };
  }
  if (await countNewCommits(wt, startPoint) === 0) {
    return { status: 'failed', summary: 'Claude не создал коммитов.', costUsd, log };
  }
  await git(wt, ['push', '-u', 'origin', branch]);
  // Автопроверка не меняет статус: владелец видит результат и решает сам
  const checks = await runChecks(wt).catch((err) => [{ name: 'подготовка', ok: false, tail: err.message }]);
  const checksLog = checks.map((c) => `\n=== ${c.name} ===\n${c.tail}`).join('');
  return { status: 'review', summary: data?.result || 'Готово к проверке', costUsd, log: log + checksLog, checks };
}
