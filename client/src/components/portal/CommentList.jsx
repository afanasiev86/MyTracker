// Подписи авторов комментариев для заказчика
const AUTHORS = { client: 'Вы', owner: 'Исполнитель' };

// Комментарии к задаче: и заказчика, и исполнителя
export default function CommentList({ comments }) {
  if (comments.length === 0) return null;
  return (
    <ul className="comments">
      {comments.map((c, i) => (
        <li key={i}>
          <span className="muted">{AUTHORS[c.author]}: </span>{c.text}
        </li>
      ))}
    </ul>
  );
}
