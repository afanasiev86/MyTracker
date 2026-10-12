// Diff ветки задачи или пояснение, что изменений пока нет
export default function DiffView({ diff }) {
  return diff.trim()
    ? <pre className="diff">{diff}</pre>
    : <p className="muted">В ветке пока нет изменений относительно основной.</p>;
}
