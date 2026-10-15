// Значения формы из проекта; без проекта — значения по умолчанию для нового
export function toForm(project) {
  if (!project) {
    return {
      slug: '', name: '', client: '', description: '', status: 'active',
      repoUrl: '', defaultBranch: 'main', commitToBase: false, deadline: '',
      priceAmount: 0, priceCurrency: 'RUB',
    };
  }
  return {
    slug: project.slug,
    name: project.name,
    client: project.client?._id || project.client || '',
    description: project.description || '',
    status: project.status,
    repoUrl: project.repoUrl || '',
    defaultBranch: project.defaultBranch || 'main',
    commitToBase: Boolean(project.commitToBase),
    deadline: project.deadline ? project.deadline.slice(0, 10) : '',
    priceAmount: project.price?.amount ?? 0,
    priceCurrency: project.price?.currency || 'RUB',
  };
}
