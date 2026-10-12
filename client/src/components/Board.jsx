import { useCallback, useState } from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import { Alert, theme } from 'antd';
import { updateTask } from '../api.js';
import KanbanBoard from '../kanban/components/KanbanBoard.jsx';
import Loading from './Loading.jsx';
import { useBoardData } from './board/useBoardData.js';
import { useBackButton } from './board/useBackButton.js';
import { projectsOf, filterTasks } from './board/filterTasks.js';
import { buildBoards } from './board/buildBoards.js';
import { planMove } from './board/planMove.js';
import BoardToolbar from './board/BoardToolbar.jsx';
import CostSummary from './board/CostSummary.jsx';

export default function Board() {
  const { tasks, costs, error, setError, loaded, load, patchTaskLocally } = useBoardData();
  const [project, setProject] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const detailOpen = Boolean(useMatch('/tasks/:view'));
  const closeDetail = useCallback(() => navigate('/tasks'), [navigate]);
  useBackButton(detailOpen, closeDetail);

  const boards = buildBoards(filterTasks(tasks, { project, search }));

  async function moveTask(move) {
    setError('');
    const { error: rejected, skip, patch } = planMove(boards, tasks, move);
    if (rejected) return setError(rejected);
    if (skip) return undefined;

    const cardId = move.cardId;
    patchTaskLocally(cardId, patch);
    try {
      await updateTask(cardId, patch);
      await load();
    } catch (err) {
      await load();
      setError(err.message);
    }
  }

  const themeVars = {
    '--kanban-accent': token.colorPrimary,
    '--kanban-column-bg': token.colorFillTertiary,
    '--kanban-card-bg': token.colorBgContainer,
    '--kanban-card-border': token.colorBorderSecondary,
    '--kanban-radius': `${token.borderRadiusLG}px`,
    '--kanban-shadow': token.boxShadowTertiary,
    '--kanban-ghost-shadow': token.boxShadowSecondary,
    '--kanban-muted': token.colorTextSecondary,
    '--kanban-placeholder-border': token.colorPrimaryBorder,
    '--kanban-placeholder-bg': token.colorPrimaryBg,
  };

  return (
    <>
      <BoardToolbar
        projects={projectsOf(tasks)}
        project={project}
        onProject={setProject}
        search={search}
        onSearch={setSearch}
        onNew={() => navigate('/tasks/new')}
      />

      <CostSummary costs={costs} />

      {error && <Alert type="error" showIcon message={error} closable onClose={() => setError('')} style={{ marginBottom: 12 }} />}
      {!loaded && <Loading text="Загружаем задачи…" />}
      {loaded && tasks.length === 0 && !error && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Задач пока нет. Нажмите «Новая задача», чтобы описать первую. Проект для неё должен быть создан во вкладке «Проекты»."
        />
      )}

      <Outlet context={{ reload: load }} />

      <div className="kanban-host" style={themeVars}>
        <KanbanBoard
          boards={boards}
          onCardMove={moveTask}
          onCardClick={(card) => navigate(`/tasks/${card.id}`)}
          accentColor={token.colorPrimary}
        />
      </div>
    </>
  );
}
