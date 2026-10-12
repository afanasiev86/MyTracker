import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Modal } from 'antd';
import NewTaskForm from '../NewTaskForm.jsx';
import TaskDetail from '../TaskDetail.jsx';

const FORM_WIDTH = 720;
const DETAIL_WIDTH = 960;

// /tasks/new
export function NewTaskRoute() {
  const { reload } = useOutletContext();
  const navigate = useNavigate();
  const close = () => navigate('/tasks');
  return (
    <Modal open footer={null} width={FORM_WIDTH} onCancel={close} title="Новая задача">
      <NewTaskForm
        onCreated={(task) => {
          navigate(`/tasks/${task._id}`, { replace: true });
          reload();
        }}
        onCancel={close}
      />
    </Modal>
  );
}

// /tasks/:id
export function TaskRoute() {
  const { id } = useParams();
  const { reload } = useOutletContext();
  const navigate = useNavigate();
  const close = () => navigate('/tasks');
  return (
    <Modal open footer={null} width={DETAIL_WIDTH} onCancel={close} className="task-modal">
      <TaskDetail id={id} onChanged={reload} />
    </Modal>
  );
}
