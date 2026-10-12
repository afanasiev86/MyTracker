// Выбор проекта, либо подсказка, если проектов ещё нет
export default function ProjectField({ projects, value, onChange }) {
  if (projects.length === 0) {
    return <p className="muted">Сначала создайте проект на вкладке «Проекты».</p>;
  }
  return (
    <label>
      Проект
      <select value={value} onChange={onChange} required>
        {projects.map((p) => (
          <option key={p._id} value={p.slug}>{p.name}</option>
        ))}
      </select>
    </label>
  );
}
