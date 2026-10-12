import { useState } from 'react';
import { TASK_STATUSES } from '../../../shared/statuses.js';
import TaskDetail from './TaskDetail.jsx';
import NewTaskForm from './NewTaskForm.jsx';
import { useBoardData } from './board/useBoardData.js';
import { useBackButton } from './board/useBackButton.js';
import { projectsOf, filterTasks } from './board/filterTasks.js';
import BoardToolbar from './board/BoardToolbar.jsx';
import CostSummary from './board/CostSummary.jsx';
import Column from './board/Column.jsx';

export default function Board() {
  const { tasks, costs, error, loaded, load } = useBoardData();
  const [project, setProject] = useState('');
  const [search, setSearch] = useState('');
  // null | 'new' | id задачи
  const [view, setView] = useState(null);
  useBackButton(view, setView);

  const visible = filterTasks(tasks, { project, search });

  return (
    <>
      <BoardToolbar
        projects={projectsOf(tasks)}
        project={project}
        onProject={setProject}
        search={search}
        onSearch={setSearch}
        onNew={() => setView('new')}
      />

      <CostSummary costs={costs} />

      {error && <p className="error" role="alert">{error}</p>}
      {!loaded && <p className="muted">Загружаем задачи…</p>}
      {loaded && tasks.length === 0 && !error && (
        <p className="muted">
          Задач пока нет. Нажмите «Новая задача», чтобы описать первую. Проект для неё должен быть создан во вкладке «Проекты».
        </p>
      )}

      {view === 'new' && (
        <NewTaskForm
          onCreated={(task) => {
            setView(task._id);
            load();
          }}
          onCancel={() => setView(null)}
        />
      )}

      {view && view !== 'new' && (
        <TaskDetail id={view} onChanged={load} onClose={() => setView(null)} />
      )}

      <div className="board">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            items={visible.filter((t) => t.status === status)}
            onOpen={setView}
          />
        ))}
      </div>
    </>
  );
}
