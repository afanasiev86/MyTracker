import { startAccessRequest } from '../services/access/startRequest.js';

// Сообщения от людей, которые не владелец. Любой /start — запрос доступа, который подтверждает владелец.
export async function handleGuest(msg) {
  const { reply } = await startAccessRequest(msg.from);
  return reply ?? 'Этот бот работает по приглашению исполнителя.';
}
