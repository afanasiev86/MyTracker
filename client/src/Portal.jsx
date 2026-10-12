import { usePortal } from './portal/usePortal.js';
import { groupByProject } from './portal/groupByProject.js';
import PortalTask from './portal/PortalTask.jsx';

// Портал заказчика: задачи его проектов, статусы и комментарии. Внутренние детали здесь не показываются.
export default function Portal() {
  const { name, tasks, loaded, error, load } = usePortal();

  if (!loaded) return <p className="muted">Загружаем ваши задачи…</p>;
  if (error) return <p className="error" role="alert">{error}</p>;

  return (
    <section>
      <h2>Здравствуйте{name ? `, ${name}` : ''}</h2>
      {tasks.length === 0 && <p className="muted">Задач пока нет. Они появятся здесь, когда исполнитель начнёт работу.</p>}
      {groupByProject(tasks).map(([project, items]) => (
        <div key={project}>
          <h3>{project}</h3>
          <div className="list">
            {items.map((t) => <PortalTask key={t.id} task={t} onChanged={load} />)}
          </div>
        </div>
      ))}
    </section>
  );
}
