import { git } from './git.js';
import { isLimitError } from './limits.js';
import { countNewCommits } from './worktree.js';
import { runChecks } from './verify/runChecks.js';
import { publishToBase } from './publish.js';
import { gitAccessHint } from './env.js';

// Итог запуска по результату claude. Порядок условий важен: первое совпавшее определяет статус.
// Возвращает { status, summary, costUsd, log, checks?, branch?, diffRange? }.
// base и direct: основная ветка проекта и режим «коммитить сразу в неё». Тогда результат отправляется в base,
// branch в итоге — это base, diffRange — коммиты запуска. Если отправить не удалось, итог failed, работа сохранена в ветке задачи.
export async function resolveOutcome({ res, data, question, cfg, wt, startPoint, branch, base, direct = false, log, costUsd }) {
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
  let published = null;
  if (direct) {
    published = await publishToBase(wt, { branch, base });
    if (!published.ok) {
      const why = published.reason === 'conflict' ? 'конфликт с новыми коммитами' : 'отправка отклонена';
      const saved = published.notSaved
        ? 'Сохранить их в ветке задачи тоже не удалось.'
        : `Изменения сохранены в ветке ${branch}.`;
      return { status: 'failed', summary: `Не удалось влить изменения в ветку ${base} (${why}): ${published.error}.${gitAccessHint(published.error)} ${saved}`, costUsd, log };
    }
  } else {
    await git(wt, ['push', '-u', 'origin', branch]);
  }
  // Автопроверка не меняет статус: владелец видит результат и решает сам
  const checks = await runChecks(wt).catch((err) => [{ name: 'подготовка', ok: false, tail: err.message }]);
  const checksLog = checks.map((c) => `\n=== ${c.name} ===\n${c.tail}`).join('');
  const outcome = { status: 'review', summary: data?.result || 'Готово к проверке', costUsd, log: log + checksLog, checks };
  if (published) {
    outcome.summary = `Изменения отправлены в ветку ${base} (коммитов: ${published.commits}).\n${outcome.summary}`;
    outcome.branch = base;
    outcome.diffRange = { from: published.from, to: published.to };
  }
  return outcome;
}
