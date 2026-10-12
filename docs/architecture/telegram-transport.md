# Telegram: транспорт, кнопки и дайджест

Кратко: бот работает через long polling без библиотек, отвечает только владельцу, кнопки обрабатываются через callback_query.

## Транспорт
telegramApi (`docs/functions/server/telegram/telegramApi.md:L3#Назначение`) вызывает Bot API через fetch. Поллер: startPolling (`docs/functions/server/bot/startPolling.md:L13#Алгоритм`) читает `getUpdates` и отдаёт обычные сообщения в handleCommand (`docs/functions/server/bot/handleCommand.md:L13#Алгоритм`), а нажатия кнопок в handleCallback (`docs/functions/server/bot/handleCallback.md:L13#Алгоритм`).

## Кнопки под проверкой
Формат данных кнопки (до 64 байт): encodeCallback (`docs/functions/server/bot/encodeCallback.md:L3#Назначение`). Клавиатура: reviewKeyboard (`docs/functions/server/bot/reviewKeyboard.md:L3#Назначение`). Декодирование: decodeCallback (`docs/functions/server/bot/decodeCallback.md:L3#Назначение`).

## Дайджест
Раз в минуту проверяется московское время, в 09:00 отправляется один раз за день: startDigestScheduler (`docs/functions/server/digest/startDigestScheduler.md:L12#Алгоритм`). Текст собирает buildDigest (`docs/functions/server/digest/buildDigest.md:L3#Назначение`), дни считает moscowParts (`docs/functions/server/digest/moscowParts.md:L3#Назначение`).

## Mini App
Главная кнопка и вибрация: `client/src/lib/telegram/mainButton.js:L5-19#setMainButton`, `client/src/lib/telegram/haptic.js:L4-10#haptic`. Экран задачи: `client/src/components/TaskDetail.jsx:L29-141#TaskDetail`.
