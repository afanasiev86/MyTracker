import { checkAttachment, displayName } from '../src/services/attachments/validate.js';
import { MAX_ATTACHMENT_BYTES } from '../src/services/attachments/config.js';

describe('вложения: проверка файла', () => {
  it('принимает картинки и возвращает расширение', () => {
    expect(checkAttachment('image/png', 100)).toBe('png');
    expect(checkAttachment('image/jpeg', 100)).toBe('jpg');
  });

  it('отклоняет не картинки', () => {
    expect(() => checkAttachment('application/pdf', 100)).toThrow('Можно прикреплять только');
  });

  it('отклоняет пустой и слишком большой файл', () => {
    expect(() => checkAttachment('image/png', 0)).toThrow('Файл пустой');
    expect(() => checkAttachment('image/png', MAX_ATTACHMENT_BYTES + 1)).toThrow('больше 5 МБ');
  });

  it('убирает пути из имени файла', () => {
    expect(displayName('../../etc/shot.png')).toBe('shot.png');
    expect(displayName('')).toBe('screenshot');
  });
});
