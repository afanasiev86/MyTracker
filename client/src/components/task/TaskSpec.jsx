// Описание задачи: цель, критерии приёмки, что не трогать, контекст
export default function TaskSpec({ task }) {
  return (
    <>
      {task.goal && <p><b>Цель:</b> {task.goal}</p>}
      {task.acceptance.length > 0 && (
        <>
          <b>Критерии приёмки:</b>
          <ul>
            {task.acceptance.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </>
      )}
      {task.outOfScope && <p><b>Не трогать:</b> {task.outOfScope}</p>}
      {task.context && <p><b>Контекст:</b> {task.context}</p>}
    </>
  );
}
