# prepareWorktree

## Назначение
Готовит отдельную рабочую копию (git worktree) под задачу: ветка `task/<id>` от нужной базы. Так параллельные задачи не мешают друг другу и не трогают основной checkout.

## Где объявлено
`server/src/worker/worktree.js:L6-16#prepareWorktree`

## Вход и выход
- Вход: `cfg`, `repo` (путь к клону проекта), `branch`, `wt` (путь к копии).
- Выход: `startPoint` — точка, от которой считаются новые коммиты (`origin/<ветка>` или `origin/<базовая>`).

## Алгоритм
1. Обновляет данные из origin: `server/src/worker/worktree.js:L7@await git(repo, ['fetch', 'origin']);`.
2. Выбирает точку старта: если ветка уже есть в origin (продолжение после вопроса или доработки), продолжаем с неё: `server/src/worker/worktree.js:L9@const startPoint = remote ?`.
3. Удаляет старую копию принудительно, включая файлы на диске и запись в git: `server/src/worker/runTask.js:L104@await git(repo, ['worktree', 'remove', '--force', wt])`.
4. Создаёт копию с веткой `-B`, то есть пересоздаёт ветку, если она уже была локально: `server/src/worker/worktree.js:L14@await git(repo, ['worktree', 'add', '-B', branch, wt, startPoint]);`.

## Ошибки и граничные случаи
- Если в origin ветки нет, работа начинается с базовой ветки. Если она есть, все коммиты предыдущих запусков сохраняются, и новые считаются от её текущего состояния.
- `-B` сбрасывает локальную ветку на startPoint. Незакоммиченные изменения в копии при этом теряются вместе с ней. Поэтому перед вопросом Claude по инструкции skill делает WIP-коммит (`.claude/skills/implement-task/SKILL.md`), а воркер пушит уже сделанные коммиты: `server/src/worker/outcome.js:L38@if (await countNewCommits(wt, startPoint) > 0)`.
- Если клона проекта нет в `REPOS_DIR`, git упадёт, и задача получит статус `failed` с текстом ошибки воркера.

## Связи
- Конвейер: `docs/architecture/run-pipeline.md:L17#Рабочая копия`.
