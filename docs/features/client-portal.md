# Портал заказчика (Telegram Mini App)

Заказчик видит свои задачи и статусы и пишет комментарии. Доступ открывает владелец после подтверждения.

## Как заказчик получает доступ
1. Заказчик пишет боту `/start`. Запрос сохраняется: `server/src/services/access/startRequest.js:L7-27#startAccessRequest`. Бот отвечает, что запрос отправлен, и сообщает владельцу.
2. Владелец во вкладке «Клиенты» видит запрос в блоке «Запросы доступа» и выбирает клиента из CRM. Компонент: `client/src/components/AccessRequests.jsx:L6-33#AccessRequests`.
3. Подтверждение привязывает Telegram к клиенту и открывает портал: `server/src/services/access/approveRequest.js:L7-26#approveAccessRequest`. Заказчик получает сообщение от бота.
4. Заказчик открывает «Трекер» в боте. Вход выдаёт роль `client`: `server/src/routes/auth/telegramLogin.js:L22@Доступ ещё не подтверждён исполнителем`. Пока доступ не подтверждён, вход отклоняется.

Закрыть доступ можно в карточке клиента: `server/src/services/access/revokePortal.js:L4-11#revokePortal`. Токены заказчика после этого перестают открывать портал, потому что доступ проверяется на каждом запросе: `server/src/services/access/isPortalOpen.js:L4-7#isPortalOpen`.

## Что видит заказчик
Функция, которая формирует данные для заказчика: `server/src/services/portal/toClientTask.js:L4-19#toClientTask`.
- Название, цель, критерии приёмки, срок, статус в понятной формулировке (`shared/statuses.js:L49-57#CLIENT_STATUS_LABELS`).
- Комментарии заказчика и комментарии владельца, отмеченные «Показать заказчику в портале».
- Не видно: запуски, стоимость, diff, логи, прогресс, ветка, системные комментарии, черновики (`backlog`).

Заказчик видит только задачи своих проектов: `server/src/services/portal/clientTasks.js:L6-14#clientTasks`. Комментарий к чужой задаче отвечает 404: `server/src/services/portal/addClientComment.js:L11-24#addClientComment`.

## Уведомления о статусе
Когда видимая заказчику подпись статуса меняется (например, «На проверке» или «Принято»), заказчику приходит сообщение в Telegram с названием задачи и проекта. Черновики и переходы без смены подписи не отправляются.
- Перехват смены статуса: `server/src/models/Task.js:L77@taskSchema.post('save'`; подписка `server/src/models/Task.js:L68-70#onTaskStatusChange`, подключение в `server/src/index.js:L51@onTaskStatusChange(notifyClientOfStatusChange);`.
- Правило «сообщать или нет»: `server/src/services/notify/client.js:L15-18#shouldNotifyClient`. Текст: `server/src/services/notify/client.js:L9-11#clientStatusMessage`.
- Получатель: только заказчик с подтверждённым доступом (`portalApproved`) и известным `telegramId`: `server/src/services/notify/client.js:L22-29#notifyClientOfStatusChange`.
- Тесты: `server/test/clientNotify.test.js:L3@describe('уведомления заказчику`.

## Безопасность
- Владельческий API закрыт от роли `client`: `server/src/middleware/roles.js:L4-9#requireOwner`. Портал открыт только роли `client`: `server/src/middleware/roles.js:L11-16#requireClient`.
- Один Telegram-аккаунт — один клиент: уникальный индекс `server/src/models/Client.js:L4-19#clientSchema`.
- Владелец не может получить портал заказчика, его роль проверяется так же.
- Ограничение: портал пока на русском языке и без вложений (скриншоты заказчику не показываются).

## Где что лежит
- Модели: `server/src/models/AccessRequest.js`, `server/src/models/Client.js`.
- API владельца для запросов: `server/src/routes/access.js`. API портала: `server/src/routes/portal.js`.
- Бот: `server/src/bot/guest.js:L4-7#handleGuest`, поллер: `server/src/bot/poller/startPolling.js:L10-54#startPolling`.
- Интерфейс заказчика: `client/src/components/Portal.jsx:L11-59#Portal`. Выбор роли при входе: `client/src/App.jsx:L12-95#App`.
