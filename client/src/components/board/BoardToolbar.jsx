// Панель над доской: фильтр по проекту, поиск и кнопка новой задачи
export default function BoardToolbar({ projects, project, onProject, search, onSearch, onNew }) {
  return (
    <div className="toolbar">
      <select value={project} onChange={(e) => onProject(e.target.value)}>
        <option value="">Все проекты</option>
        {projects.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <input
        type="search"
        placeholder="Поиск по названию"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      <button onClick={onNew}>Новая задача</button>
    </div>
  );
}
