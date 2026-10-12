// Дата из JSON приходит строкой: переводим в Date, пустую дату — в null
export function normalize(data) {
  const out = { ...data };
  if (out.deadline !== undefined) out.deadline = out.deadline ? new Date(out.deadline) : null;
  if (out.client === '') out.client = null;
  return out;
}
