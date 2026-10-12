// Тело запроса из значений формы: пробелы убираем, пустые поля приводим к null или значению по умолчанию
export function buildProjectBody(form) {
  return {
    slug: form.slug.trim().toLowerCase(),
    name: form.name.trim(),
    client: form.client || null,
    description: form.description.trim(),
    status: form.status,
    repoUrl: form.repoUrl.trim(),
    defaultBranch: form.defaultBranch.trim() || 'main',
    deadline: form.deadline || null,
    price: { amount: Number(form.priceAmount) || 0, currency: form.priceCurrency },
  };
}
