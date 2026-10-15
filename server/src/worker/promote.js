import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { git } from './git.js';
import { reason } from './publish.js';
import { ensureGitIdentity } from './worktree.js';

// Переносит коммиты принятой задачи из UAT в основную ветку (cherry-pick) и отправляет её на GitHub.
// Работает во временной копии, а не в клоне проекта: клон может быть занят запуском Claude.
// Если основную ветку успели обновить между попыткой и пушем, попытка повторяется один раз.
// Возвращает { ok: true } или { ok: false, reason: 'conflict' | 'push', error }.
export async function promoteToBase(repo, { base, commits }) {
  await ensureGitIdentity(repo);
  await git(repo, ['fetch', 'origin', base]);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-promote-'));
  await git(repo, ['worktree', 'add', '--detach', dir, `origin/${base}`]);
  try {
    let failure = { reason: 'push', error: 'неизвестная ошибка' };
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await git(dir, ['fetch', 'origin', base]);
      await git(dir, ['reset', '--hard', `origin/${base}`]);
      try {
        await git(dir, ['cherry-pick', ...commits]);
      } catch (err) {
        await git(dir, ['cherry-pick', '--abort']).catch(() => {});
        return { ok: false, reason: 'conflict', error: reason(err) };
      }
      try {
        await git(dir, ['push', 'origin', `HEAD:refs/heads/${base}`]);
        return { ok: true };
      } catch (err) {
        failure = { reason: 'push', error: reason(err) };
      }
    }
    return { ok: false, ...failure };
  } finally {
    await git(repo, ['worktree', 'remove', '--force', dir]).catch(() => {});
    await fs.rm(dir, { recursive: true, force: true });
  }
}
