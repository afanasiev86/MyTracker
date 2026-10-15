import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getConfig } from '../../config.js';
import { gitEnv, gitAccessHint } from '../../worker/env.js';

const execFileAsync = promisify(execFile);
// Меньше минуты: дольше nginx ответ API не ждёт
const CLONE_TIMEOUT_MS = 55 * 1000;

// Только https:// и ssh-адреса GitHub-стиля. Локальные пути, ext:: и ключи вида --option не проходят.
const HTTPS_URL = /^https:\/\/[\w.-]+(:\d+)?\/[\w.~%/-]+$/;
const SSH_URL = /^(ssh:\/\/)?git@[\w.-]+[:/][\w.~/-]+$/;

export const isRepoUrl = (url) => HTTPS_URL.test(url) || SSH_URL.test(url);

// Пароль или токен внутри ссылки не должны попасть в ответ и журнал
const hideSecrets = (text) => String(text).replace(/\/\/[^@/\s]+@/g, '//***@');

export const repoPath = (slug) => path.join(getConfig().worker.reposDir, slug);

// Клонирует репозиторий проекта в REPOS_DIR/<slug>, если папки ещё нет.
// Возвращает { status: none | exists | cloned | failed, error? }; ошибка клонирования не ломает сохранение проекта.
export async function ensureRepo(project) {
  const { reposDir } = getConfig().worker;
  if (!reposDir || !project.repoUrl) return { status: 'none' };
  const target = repoPath(project.slug);
  if (await fs.access(target).then(() => true, () => false)) return { status: 'exists' };
  try {
    await fs.mkdir(reposDir, { recursive: true });
    await execFileAsync(
      'git',
      ['-c', 'protocol.ext.allow=never', '-c', 'protocol.file.allow=never', 'clone', '--', project.repoUrl, target],
      {
        timeout: CLONE_TIMEOUT_MS,
        // Для https://github.com токен берётся из настроек (см. worker/env.js), для git@ нужен ключ сервера
        env: { ...gitEnv(), GIT_SSH_COMMAND: 'ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new' },
      },
    );
    return { status: 'cloned' };
  } catch (err) {
    await fs.rm(target, { recursive: true, force: true });
    if (err.killed) return { status: 'failed', error: 'Клонирование заняло больше минуты: склонируйте репозиторий в папку проекта вручную' };
    const lines = hideSecrets(err.stderr || err.message).split('\n').map((l) => l.trim()).filter(Boolean);
    return { status: 'failed', error: `${lines.slice(-3).join(' ').slice(0, 300)}${gitAccessHint(lines.join(' '))}` };
  }
}
