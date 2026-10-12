import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Alert } from 'antd';
import ProjectForm from '../ProjectForm.jsx';

// /projects/new и /projects/:id
export default function ProjectRoute() {
  const { id } = useParams();
  const { projects, loaded, saved, remove } = useOutletContext();
  const navigate = useNavigate();

  if (!id) {
    return (
      <ProjectForm
        key="new"
        project={null}
        onSaved={() => saved('Проект создан')}
        onCancel={() => navigate('/projects')}
        onDelete={null}
      />
    );
  }

  if (!loaded) return null;
  const project = projects.find((p) => p._id === id);
  if (!project) return <Alert type="error" showIcon message="Проект не найден" style={{ marginBottom: 12 }} />;

  return (
    <ProjectForm
      key={project._id}
      project={project}
      onSaved={() => saved('Изменения сохранены')}
      onCancel={() => navigate('/projects')}
      onDelete={() => remove(project)}
    />
  );
}
