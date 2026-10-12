import CommentList from './CommentList.jsx';
import CommentForm from './CommentForm.jsx';

// Карточка задачи в портале: статус, цель, критерии, срок, комментарии и форма ответа
export default function PortalTask({ task, onChanged }) {
  return (
    <article className="row-card">
      <div>
        <strong>{task.title}</strong>
        <span className="badge">{task.statusLabel}</span>
      </div>
      {task.goal && <p>{task.goal}</p>}
      {task.acceptance.length > 0 && (
        <ul>
          {task.acceptance.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}
      {task.dueDate && <p className="muted">Срок: {new Date(task.dueDate).toLocaleDateString('ru-RU')}</p>}

      <CommentList comments={task.comments} />
      <CommentForm taskId={task.id} onSent={onChanged} />
    </article>
  );
}
