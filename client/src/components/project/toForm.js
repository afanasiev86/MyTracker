// Значения формы из проекта; без проекта — значения по умолчанию для нового
export function toForm(project) {
  if (!project) {
    return {
      slug: '', name: '', client: '', status: 'active',
      repoUrl: '', defaultBranch: 'main', commitToBase: false, uatBranch: 'uat',
    };
  }
  return {
    slug: project.slug,
    name: project.name,
    client: project.client?._id || project.client || '',
    status: project.status,
    repoUrl: project.repoUrl || '',
    defaultBranch: project.defaultBranch || 'main',
    commitToBase: Boolean(project.commitToBase),
    uatBranch: project.uatBranch || 'uat',
  };
}
