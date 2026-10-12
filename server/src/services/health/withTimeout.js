const TIMEOUT_MS = 5 * 1000;

// Ограничивает время ожидания: зависший сервис не должен зависать и /api/health
export function withTimeout(promise, ms = TIMEOUT_MS) {
  let timer;
  const limit = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('нет ответа')), ms);
  });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
}

export { TIMEOUT_MS };
