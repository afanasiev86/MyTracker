import { createElement } from 'react';
import { Badge } from 'antd';
import { TASK_STATUSES, STATUS_LABELS } from '../../../../shared/statuses.js';
import TaskCardBody from './TaskCardBody.jsx';

// Колонки доски по статусам: { [status]: { id, title, cards } }. Порядок карточек — как в списке задач.
export function buildBoards(tasks) {
  return Object.fromEntries(
    TASK_STATUSES.map((status) => {
      const cards = tasks
        .filter((t) => t.status === status)
        .map((t) => ({ id: t._id, text: t.title, content: createElement(TaskCardBody, { task: t }) }));
      const title = createElement(
        'span',
        { className: 'board-title-row' },
        STATUS_LABELS[status],
        createElement(Badge, { count: cards.length, showZero: true, color: '#8c8c8c' }),
      );
      return [status, { id: status, title, cards }];
    }),
  );
}
