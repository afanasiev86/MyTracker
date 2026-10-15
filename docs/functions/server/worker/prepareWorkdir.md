# prepareWorkdir

## Назначение
Готовит клон проекта в `REPOS_DIR/<slug>` под задачу: локальная ветка `task/<id>` от целевой ветки (UAT или основной). Claude работает прямо в клоне, поэтому `node_modules` и другие игнорируемые файлы переживают запуски. Одновременных запусков в одном проекте нет (очередь по проекту), так что клон занят одной задачей.

## Где объявлено
`server/src/worker/worktree.js:L20-39#prepareWorkdir`

## Вход и выход
- Вход: `repo` (путь к клону проекта), `branch` (`task/<id>`), `target` (ветка, куда пойдёт результат: UAT или основная, см. `server/src/services/projects/baseBranch.js:L7-14#branchSettings`), `base` (основная ветка проекта, без значения общая `DEFAULT_BRANCH`).
- Выход: `startPoint` — точка, от которой считаются новые коммиты (`origin/task/<id>` или `origin/<target>`).

## Алгоритм
1. Обновляет данные из origin: `server/src/worker/worktree.js:L22@await git(repo, ['fetch', 'origin']);`.
2. Если целевой ветки нет в origin (первый запуск проекта с UAT), создаёт её пушем от `origin/<base>`.
3. Выбирает точку старта: если ветка уже есть в origin (продолжение после вопроса или доработки), продолжаем с неё: `server/src/worker/worktree.js:L27@const startPoint = (await remoteHas`.
4. Прерывает незавершённый `rebase` (остался после перезапуска сервера) и чистит записи о пропавших worktree.
5. Переключается принудительно с пересозданием ветки: `server/src/worker/worktree.js:L31@'checkout', '-f', '-B'`.
6. Удаляет локальные ветки `task/*` прошлых запусков (работа ожидающих ответа задач лежит в origin).
7. Удаляет неотслеживаемые файлы (`git clean -fd`), игнорируемые остаются. Отдельно стирает служебное трекера: скриншоты и копию инструкции `/implement-task`, иначе она устарела бы вместе с трекером.

## Ошибки и граничные случаи
- Если в origin ветки нет, работа начинается с целевой ветки. Если она есть, все коммиты предыдущих запусков сохраняются, и новые считаются от её текущего состояния.
- `checkout -f -B` сбрасывает локальную ветку на startPoint и стирает незакоммиченное. Поэтому перед вопросом Claude по инструкции skill делает WIP-коммит (`.claude/skills/implement-task/SKILL.md`), а воркер пушит уже сделанные коммиты: `server/src/worker/outcome.js:L47@if (await countNewCommits(wt, startPoint) > 0)`.
- Если клона проекта нет в `REPOS_DIR`, git упадёт, и задача получит статус `failed` с текстом ошибки воркера.
- После запуска клон остаётся на ветке задачи с её файлами. Править клон на сервере руками нельзя: следующий запуск сотрёт незакоммиченное.
- Зависимости: `server/src/worker/verify/ensureDependencies.js:L18@export async function ensureDependencies` ставит их заново, только если изменились `package.json` или `package-lock.json` (хеш в `node_modules/.mytracker-deps`).

## Связи
- Конвейер: `docs/architecture/run-pipeline.md:L21#Рабочая копия`.
