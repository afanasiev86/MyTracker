// Ошибка предметной области: сервис говорит, что не так (код и текст), а HTTP-статус выбирает errorHandler.
export class DomainError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

// Коды ошибок и соответствующий HTTP-статус. Используется только в errorHandler.
export const STATUS_BY_CODE = {
  invalid: 400,
  not_found: 404,
  conflict: 409,
  unsupported: 415,
  too_large: 413,
  unavailable: 503,
};

export function domainError(code, message) {
  return new DomainError(code, message);
}
