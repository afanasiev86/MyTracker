# materializeScreenshots

## Назначение
Копирует скриншоты задачи из хранилища в рабочую копию, чтобы Claude открыл их инструментом Read.

## Где объявлено
`server/src/worker/screenshots/materializeScreenshots.js:L9-22#materializeScreenshots`

## Вход и выход
- Вход: `task`, `wt` (путь к рабочей копии).
- Выход: список относительных путей файлов. Пустой список, если вложений нет.

## Алгоритм
1. Читает файлы вложений с диска: `server/src/worker/screenshots/materializeScreenshots.js:L10@const files = await readAttachments(task);`.
2. Создаёт папку и исключает её из git: `server/src/worker/screenshots/materializeScreenshots.js:L14@await excludeFromGit(wt);`.
3. Пишет файлы с безопасными именами: `server/src/worker/screenshots/materializeScreenshots.js:L18@await fs.writeFile(path.join(wt, rel), file.buffer);`.

## Ошибки и граничные случаи
- Сбой скачивания не останавливает запуск: `server/src/worker/runTask.js:L40@Скриншоты:`. Claude работает без картинок, а в логе видна причина.
- Не больше 10 файлов на запуск: `server/src/services/attachments/config.js:L10-10#MAX_SCREENSHOTS_PER_RUN`.
- Исключение папки делается в общем каталоге git (`info/exclude`), поэтому видно во всех рабочих копиях. Это безопасно: папка только для скриншотов.

## Связи
- Подсказка Claude: `server/src/worker/screenshots/screenshotNote.js:L2-5#screenshotNote`.
- Вложения: `docs/features/tasks-and-runs.md:L42#Вложения`.
