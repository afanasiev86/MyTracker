// Тело запроса из значений формы: пробелы убираем, пустые поля приводим к null или значению по умолчанию
export function buildProjectBody(form) {
  return {
    // Код нового проекта строит сервер из названия
    ...(form.slug.trim() && { slug: form.slug.trim().toLowerCase() }),
    name: form.name.trim(),
    client: form.client || null,
    status: form.status,
    repoUrl: form.repoUrl.trim(),
    defaultBranch: form.defaultBranch.trim() || 'main',
    commitToBase: Boolean(form.commitToBase),
    uatBranch: form.uatBranch.trim() || 'uat',
  };
}
