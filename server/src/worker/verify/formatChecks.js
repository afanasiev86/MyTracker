// Короткая строка для комментария и уведомления: «npm run test — пройдено; npm run lint — не пройдено»
export function formatChecks(results) {
  return results
    .map((r) => (r.name === 'подготовка' ? `автопроверка не запущена: ${r.tail.slice(0, 200)}` : `npm run ${r.name} — ${r.ok ? 'пройдено' : `не пройдено (код ${r.code ?? '?'})`}`))
    .join('; ');
}
