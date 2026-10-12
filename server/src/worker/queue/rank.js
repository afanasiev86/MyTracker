// Порядок приоритетов: меньше — раньше
export const RANK = { high: 0, normal: 1, low: 2 };

export function rankOf(priority) {
  return RANK[priority] ?? RANK.normal;
}
