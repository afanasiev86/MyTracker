// Пустой клиент из формы — это «без клиента» (null)
export function normalize(data) {
  const out = { ...data };
  if (out.client === '') out.client = null;
  return out;
}
