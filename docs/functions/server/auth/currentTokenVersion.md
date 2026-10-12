# currentTokenVersion

## Назначение
Возвращает текущую версию токенов из базы. Версия нужна, чтобы отзыв мог invalidate все выданные токены сразу.

## Где объявлено
`server/src/services/auth.js:L17-27#currentTokenVersion`

## Вход и выход
- Вход: нет.
- Выход: `Promise<number>` — значение `tokenVersion` из документа `Settings` с ключом `auth`.

## Алгоритм
1. Если версия уже в памяти, возвращает её без похода в базу: `server/src/services/auth.js:L18@if (cachedVersion === null)`.
2. Иначе атомарно читает или создаёт документ `Settings` с `key: 'auth'`: `server/src/services/auth.js:L19@findOneAndUpdate`.
3. При создании документа ставит `tokenVersion: 1` через `$setOnInsert`, поэтому повторный вызов не перезапишет значение: `server/src/services/auth.js:L21@$setOnInsert`.
4. Сохраняет результат в `cachedVersion`: `server/src/services/auth.js:L24@cachedVersion = doc.tokenVersion;`.

## Ошибки и граничные случаи
- Кэш живёт в памяти процесса. Если два процесса API работали бы одновременно, отзыв в одном не был бы виден в другом до перезапуска. Сейчас процесс один, поэтому ограничение не действует, но его нужно учесть при масштабировании.
- Если база недоступна, ошибка уходит наверх и попадает в `requireAuth` как отказ входа.

## Связи
- Подход: `docs/architecture/auth-tokens.md:L17#Отзыв токенов`.
- Вызывается из `server/src/services/auth.js:L45-51#verifyToken` и `server/src/services/auth.js:L39-42#issueToken`.
