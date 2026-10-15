import { git } from './git.js';

// Последние строки вывода git: по ним владелец понимает, что пошло не так
const reason = (err) => String(err.stderr || err.message).split('\n').map((l) => l.trim()).filter(Boolean).slice(-3).join(' ').slice(0, 300);

// Одна попытка: подтянуть основную ветку, переложить коммиты задачи поверх неё и отправить.
// При конфликте возвращает { conflict: true }, остальные ошибки git выбрасываются.
async function rebaseAndPush(wt, base) {
  await git(wt, ['fetch', 'origin', base]);
  const from = (await git(wt, ['rev-parse', `origin/${base}`])).trim();
  try {
    await git(wt, ['rebase', `origin/${base}`]);
  } catch (err) {
    await git(wt, ['rebase', '--abort']).catch(() => {});
    return { conflict: true, error: reason(err) };
  }
  await git(wt, ['push', 'origin', `HEAD:refs/heads/${base}`]);
  const to = (await git(wt, ['rev-parse', 'HEAD'])).trim();
  return { from, to };
}

// Отправка результата задачи прямо в основную ветку проекта (режим «коммитить сразу в основную ветку»).
// Коммиты перекладываются поверх свежей основной ветки; если её успели обновить между попыткой и пушем, попытка повторяется.
// Если вливание не удалось (конфликт, ветка защищена, нет прав), работа сохраняется в ветке задачи на GitHub,
// чтобы рабочая копия могла быть удалена без потерь.
// Возвращает { ok: true, from, to, commits } или { ok: false, reason: 'conflict' | 'push', error, notSaved? }.
export async function publishToBase(wt, { branch, base }) {
  let failure = { reason: 'push', error: 'неизвестная ошибка' };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await rebaseAndPush(wt, base);
      if (res.conflict) {
        // Повтор конфликт не уберёт
        failure = { reason: 'conflict', error: res.error };
        break;
      }
      // Черновая ветка (после вопроса Claude) больше не нужна: всё уже в основной ветке
      await git(wt, ['push', 'origin', '--delete', branch]).catch(() => {});
      const commits = Number((await git(wt, ['rev-list', '--count', `${res.from}..${res.to}`])).trim());
      return { ok: true, from: res.from, to: res.to, commits };
    } catch (err) {
      failure = { reason: 'push', error: reason(err) };
    }
  }
  // Ветка задачи только наша, поэтому после перекладывания коммитов её можно перезаписать
  await git(wt, ['push', '--force', '-u', 'origin', branch]).catch(() => { failure.notSaved = true; });
  return { ok: false, ...failure };
}
