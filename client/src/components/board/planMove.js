import { STATUS_LABELS, canTransition } from '../../../../shared/statuses.js';
import { orderBetween } from '../../../../shared/taskOrder.js';
import { moveCard } from '../../kanban/drag/moveCard.js';

const ids = (board) => board.cards.map((c) => c.id).join();

// Что делать с переносом карточки: { error } — перенос запрещён правилами статусов,
// { skip } — карточка осталась на месте, { patch } — поля задачи для PATCH.
export function planMove(boards, tasks, { cardId, fromBoardId, toBoardId, toIndex }) {
  const statusChanged = fromBoardId !== toBoardId;
  if (statusChanged && !canTransition(fromBoardId, toBoardId)) {
    return { error: `Нельзя перенести задачу из «${STATUS_LABELS[fromBoardId]}» в «${STATUS_LABELS[toBoardId]}»` };
  }

  const next = moveCard(boards, { cardId, fromBoardId, toBoardId, toIndex });
  if (!statusChanged && ids(next[toBoardId]) === ids(boards[toBoardId])) return { skip: true };

  const byId = new Map(tasks.map((t) => [t._id, t]));
  const cards = next[toBoardId].cards;
  const at = cards.findIndex((c) => c.id === cardId);
  const order = orderBetween(byId.get(cards[at - 1]?.id), byId.get(cards[at + 1]?.id));
  return { patch: statusChanged ? { status: toBoardId, order } : { order } };
}
