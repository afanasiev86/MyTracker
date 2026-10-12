import { useState } from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import { Alert, Button, Flex } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { deleteProject } from '../api.js';
import { confirmAction } from '../lib/telegram/confirm.js';
import Loading from './Loading.jsx';
import ProjectCard from './projects/ProjectCard.jsx';
import { useProjectList } from './projects/useProjectList.js';

export default function Projects() {
  const { projects, loaded, error, setError, load } = useProjectList();
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const formOpen = Boolean(useMatch('/projects/:view'));

  function saved(message) {
    navigate('/projects');
    setNotice(message);
    load();
  }

  async function remove(project) {
    const ok = await confirmAction(`Удалить проект «${project.name}»? Это нельзя отменить.`);
    if (!ok) return;
    setError('');
    try {
      await deleteProject(project._id);
      navigate('/projects');
      setNotice(`Проект «${project.name}» удалён`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <Flex gap={8} style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setNotice(''); navigate('/projects/new'); }}>
          Новый проект
        </Button>
      </Flex>

      {notice && !formOpen && <Alert type="success" showIcon message={notice} closable onClose={() => setNotice('')} style={{ marginBottom: 12 }} />}
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}

      <Outlet context={{ projects, loaded, saved, remove }} />

      {!loaded && <Loading text="Загружаем проекты…" />}
      {loaded && projects.length === 0 && (
        <Alert
          type="info"
          showIcon
          message="Проектов пока нет. Проект нужен, чтобы создавать задачи: он задаёт slug и папку репозитория."
        />
      )}

      <Flex vertical gap={8}>
        {projects.map((p) => (
          <ProjectCard
            key={p._id}
            project={p}
            onOpen={(project) => { setNotice(''); navigate(`/projects/${project._id}`); }}
          />
        ))}
      </Flex>
    </>
  );
}
