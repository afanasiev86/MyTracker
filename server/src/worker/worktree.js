import { git } from './git.js';
import { SCREENSHOT_DIR } from './screenshots/config.js';
import { SKILL_NAME } from './installSkill.js';

// Если у git на сервере не настроено имя автора, commit и rebase падают («Committer identity unknown»).
// Задаём имя только в этом репозитории и только если его нет ни в глобальной, ни в системной настройке.
export async function ensureGitIdentity(repo) {
  const isSet = async (key) => (await git(repo, ['config', '--get', key]).catch(() => '')).trim() !== '';
  if (!(await isSet('user.name'))) await git(repo, ['config', 'user.name', 'Claude (MyTracker)']);
  if (!(await isSet('user.email'))) await git(repo, ['config', 'user.email', 'claude@mytracker.local']);
}

const remoteHas = async (repo, name) => (await git(repo, ['ls-remote', '--heads', 'origin', name])).trim() !== '';

// Создаёт ветку name в origin от основной ветки base, если её там ещё нет. Данные origin в клоне должны быть свежими (после fetch).
export async function ensureRemoteBranch(repo, name, base) {
  if (await remoteHas(repo, name)) return;
  await git(repo, ['push', 'origin', `refs/remotes/origin/${base}:refs/heads/${name}`]);
  await git(repo, ['fetch', 'origin', name]);
}

// Готовит клон проекта под задачу: Claude работает прямо в нём, чтобы node_modules жили между запусками.
// target: ветка, куда пойдёт результат (UAT или основная). Если её ещё нет в origin, создаётся от основной ветки base.
// Если рабочая ветка branch уже есть в origin (продолжение после вопроса), продолжаем с неё, иначе начинаем от target.
// Незакоммиченные остатки прошлого запуска стираются, игнорируемые git файлы (node_modules) остаются.
// Запуски одного проекта идут по очереди, поэтому клон занят одной задачей.
export async function prepareWorkdir(repo, branch, target, base) {
  await ensureGitIdentity(repo);
  await git(repo, ['fetch', 'origin']);
  await ensureRemoteBranch(repo, target, base);
  const startPoint = (await remoteHas(repo, branch)) ? `origin/${branch}` : `origin/${target}`;

  await git(repo, ['rebase', '--abort']).catch(() => {});
  await git(repo, ['worktree', 'prune']);
  await git(repo, ['checkout', '-f', '-B', branch, startPoint]);
  // Работа ожидающих ответа задач лежит в origin, локальные ветки прошлых запусков больше не нужны
  const stale = (await git(repo, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/task/'])).split('\n').filter((name) => name && name !== branch);
  if (stale.length > 0) await git(repo, ['branch', '-D', ...stale]);
  await git(repo, ['clean', '-fd']);
  // Служебные файлы трекера исключены из git и не удаляются выше: прошлые скриншоты и копия инструкции устаревают
  await git(repo, ['clean', '-fdx', '--', SCREENSHOT_DIR, `.claude/skills/${SKILL_NAME}`]);
  return startPoint;
}

// Сколько коммитов Claude сделал поверх точки старта
export async function countNewCommits(wt, startPoint) {
  return Number((await git(wt, ['rev-list', '--count', `${startPoint}..HEAD`])).trim());
}
