# prepareWorktree

## Назначение
Готовит отдельную рабочую копию (git worktree) под задачу: ветка `task/<id>` от нужной базы. Так параллельные задачи не мешают друг другу и не трогают основной checkout.

## Где объявлено
`server/src/worker/worktree.js:L15-26#prepareWorktree`

## Вход и выход
- Вход: `repo` (путь к клону проекта), `branch`, `wt` (путь к копии), `base` (основная ветка проекта: `server/src/services/projects/baseBranch.js:L14-16#baseBranch`, поле «Основная ветка», без значения общая `DEFAULT_BRANCH`).
- Выход: `startPoint` — точка, от которой считаются новые коммиты (`origin/<ветка>` или `origin/<базовая>`).

## Алгоритм
1. Обновляет данные из origin: `server/src/worker/worktree.js:L17@await git(repo, ['fetch', 'origin']);`.
2. Выбирает точку старта: если ветка уже есть в origin (продолжение после вопроса или доработки), продолжаем с неё: `server/src/worker/worktree.js:L19@const startPoint = remote ?`.
3. Удаляет старую копию принудительно, включая файлы на диске и запись в git: `server/src/worker/runTask.js:L111@await git(repo, ['worktree', 'remove', '--force', wt])`.
4. Создаёт копию с веткой `-B`, то есть пересоздаёт ветку, если она уже была локально: `server/src/worker/worktree.js:L24@await git(repo, ['worktree', 'add', '-B', branch, wt, startPoint]);`.

## Ошибки и граничные случаи
- Если в origin ветки нет, работа начинается с базовой ветки. Если она есть, все коммиты предыдущих запусков сохраняются, и новые считаются от её текущего состояния.
- `-B` сбрасывает локальную ветку на startPoint. Незакоммиченные изменения в копии при этом теряются вместе с ней. Поэтому перед вопросом Claude по инструкции skill делает WIP-коммит (`.claude/skills/implement-task/SKILL.md`), а воркер пушит уже сделанные коммиты: `server/src/worker/outcome.js:L47@if (await countNewCommits(wt, startPoint) > 0)`.
- Если клона проекта нет в `REPOS_DIR`, git упадёт, и задача получит статус `failed` с текстом ошибки воркера.

## Связи
- Конвейер: `docs/architecture/run-pipeline.md:L21#Рабочая копия`.
