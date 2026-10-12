import { Typography } from 'antd';

// Один блок описания: подпись и текст
function Part({ label, children }) {
  return (
    <section className="task-part">
      <Typography.Text type="secondary" className="task-part-label">{label}</Typography.Text>
      {children}
    </section>
  );
}

// Описание задачи: цель, критерии приёмки, что не трогать, контекст
export default function TaskSpec({ task }) {
  const hasSpec = task.goal || task.acceptance.length > 0 || task.outOfScope || task.context;
  if (!hasSpec) {
    return (
      <Typography.Paragraph type="secondary">
        Описание не заполнено: добавьте цель и критерии приёмки, чтобы Claude понял, что считать результатом.
      </Typography.Paragraph>
    );
  }
  return (
    <>
      {task.goal && <Part label="Цель"><Typography.Paragraph>{task.goal}</Typography.Paragraph></Part>}
      {task.acceptance.length > 0 && (
        <Part label="Критерии приёмки">
          <ul className="task-criteria">
            {task.acceptance.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </Part>
      )}
      {task.outOfScope && <Part label="Не трогать"><Typography.Paragraph>{task.outOfScope}</Typography.Paragraph></Part>}
      {task.context && <Part label="Контекст"><Typography.Paragraph>{task.context}</Typography.Paragraph></Part>}
    </>
  );
}
