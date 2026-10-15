import { git } from './git.js';
import { isLimitError } from './limits.js';
import { countNewCommits } from './worktree.js';
import { runChecks } from './verify/runChecks.js';
import { publishToBase } from './publish.js';
import { gitAccessHint } from './env.js';

// Итог запуска по результату claude. Порядок условий важен: первое совпавшее определяет статус.
// Возвращает { status, summary, costUsd, log, checks?, branch?, diffRange?, commits? }.
// base: ветка, куда уходит результат (UAT или основная, если проект коммитит сразу в ПРОД). branch в итоге — это base,
// diffRange — коммиты запуска, commits — их хеши по порядку. Если отправить не удалось, итог failed, работа сохранена в ветке задачи.
export async function resolveOutcome({ res, data, question, cfg, wt, startPoint, branch, base, log, costUsd }) {
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
  // Лимит подписки: Claude Code завершается с ошибкой и пишет об этом в итоговом событии или в stderr.
  // Целиком вывод не проверяем: успешный запуск, где Claude читал код со словами «rate limit», принимался бы за лимит
  // и терял сделанные коммиты.
  const runFailed = res.code !== 0 || Boolean(data?.is_error);
  const errorText = [data?.is_error ? data.result : '', data ? '' : res.stdout.slice(-2000), res.stderr.slice(-2000)].join('\n');
  if (runFailed && isLimitError(errorText)) {
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
  const published = await publishToBase(wt, { branch, base });
  if (!published.ok) {
    const why = published.reason === 'conflict' ? 'конфликт с новыми коммитами' : 'отправка отклонена';
    const saved = published.notSaved
      ? 'Сохранить их в ветке задачи тоже не удалось.'
      : `Изменения сохранены в ветке ${branch}.`;
    return { status: 'failed', summary: `Не удалось влить изменения в ветку ${base} (${why}): ${published.error}.${gitAccessHint(published.error)} ${saved}`, costUsd, log };
  }
  // Автопроверка не меняет статус: владелец видит результат и решает сам
  const checks = await runChecks(wt).catch((err) => [{ name: 'подготовка', ok: false, tail: err.message }]);
  const checksLog = checks.map((c) => `\n=== ${c.name} ===\n${c.tail}`).join('');
  return {
    status: 'review',
    summary: `Изменения отправлены в ветку ${base} (коммитов: ${published.commits}).\n${data?.result || 'Готово к проверке'}`,
    costUsd,
    log: log + checksLog,
    checks,
    branch: base,
    diffRange: { from: published.from, to: published.to },
    commits: published.shas,
  };
}
