import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Команды бота для сервера: подтверждение кнопкой, потом действие. Подменены только действия над системой.
const controlService = jest.fn();
const startDeploy = jest.fn();
const readLogs = jest.fn();
const unbanSsh = jest.fn();
jest.unstable_mockModule('../src/services/ops/unbanSsh.js', () => ({ unbanSsh }));
jest.unstable_mockModule('../src/services/ops/control.js', () => ({ controlService, stoppedOnPurpose: new Set() }));
jest.unstable_mockModule('../src/services/ops/deploy.js', () => ({ startDeploy, deployInfo: jest.fn() }));
jest.unstable_mockModule('../src/services/ops/logs.js', () => ({ readLogs, DEFAULT_LINES: 50 }));
jest.unstable_mockModule('../src/services/ops/platform.js', () => ({ opsAvailable: () => true, assertOpsAvailable: () => {} }));

const { serviceCommand, deployCommand, logsCommand, unbanCommand } = await import('../src/bot/commands/opsCommand.js');
const { handleCommand } = await import('../src/bot/commands/handleCommand.js');
const { HELP } = await import('../src/bot/commands/help.js');
const { handleOpsCallback } = await import('../src/bot/callbacks/opsCallback.js');
const { decodeOpsCallback, encodeOpsCallback } = await import('../src/bot/opsCallbackData.js');

beforeEach(() => {
  controlService.mockReset();
  startDeploy.mockReset();
  readLogs.mockReset();
  unbanSsh.mockReset();
});

describe('/unban', () => {
  it('сразу снимает блокировки и сообщает, сколько адресов освобождено', async () => {
    unbanSsh.mockResolvedValue(2);
    expect(await unbanCommand()).toBe('Блокировки fail2ban сняты, адресов: 2.');
    expect(unbanSsh).toHaveBeenCalledTimes(1);
  });

  it('если блокировок не было, так и пишет', async () => {
    unbanSsh.mockResolvedValue(0);
    expect(await unbanCommand()).toBe('Блокировок fail2ban нет.');
  });

  it('причину сбоя показывает владельцу, а не падает', async () => {
    unbanSsh.mockRejectedValue(new Error('нет прав или скрипта: выполните на сервере deploy/ops-setup.sh'));
    expect(await unbanCommand()).toMatch(/Не удалось снять блокировки: нет прав/);
  });

  it('доступна как команда бота и описана в справке', async () => {
    unbanSsh.mockResolvedValue(1);
    expect(await handleCommand('/unban')).toMatch(/адресов: 1/);
    expect(HELP).toMatch(/\/unban/);
  });
});

describe('/service и /deploy', () => {
  it('сначала спрашивают подтверждение и ничего не выполняют', () => {
    const reply = serviceCommand(['restart', 'nginx']);
    expect(reply.text).toBe('Перезапустить «nginx»?');
    const [confirm] = reply.reply_markup.inline_keyboard[0];
    expect(decodeOpsCallback(confirm.callback_data)).toEqual({ action: 'restart', target: 'nginx' });
    expect(deployCommand().reply_markup.inline_keyboard[0][0].text).toBe('Подтвердить');
    expect(controlService).not.toHaveBeenCalled();
    expect(startDeploy).not.toHaveBeenCalled();
  });

  it('неверные аргументы и недоступные действия объясняются', () => {
    expect(serviceCommand([])).toMatch(/Использование/);
    expect(serviceCommand(['reboot', 'nginx'])).toMatch(/Использование/);
    expect(serviceCommand(['restart', 'sshd'])).toMatch(/Доступны: mytracker-api, nginx/);
    expect(serviceCommand(['stop', 'mytracker-api'])).toMatch(/недоступно/);
  });
});

describe('/logs', () => {
  it('обрезает длинный журнал под лимит сообщения', async () => {
    readLogs.mockResolvedValue('x'.repeat(9000));
    const text = await logsCommand(['nginx', '200']);
    expect(text.length).toBeLessThanOrEqual(3801);
    expect(readLogs).toHaveBeenCalledWith('nginx', '200');
  });

  it('без сервиса подсказывает список', async () => {
    expect(await logsCommand([])).toMatch(/Доступны/);
    expect(readLogs).not.toHaveBeenCalled();
  });
});

describe('нажатие кнопок', () => {
  it('«Подтвердить» выполняет действие над сервисом', async () => {
    controlService.mockResolvedValue({ scheduled: false });
    const text = await handleOpsCallback(encodeOpsCallback('stop', 'nginx'));
    expect(controlService).toHaveBeenCalledWith('nginx', 'stop');
    expect(text).toBe('«nginx» остановлен.');
  });

  it('перезапуск самого API сообщает, что вернётся с уведомлением', async () => {
    controlService.mockResolvedValue({ scheduled: true });
    expect(await handleOpsCallback(encodeOpsCallback('restart', 'mytracker-api'))).toMatch(/Напишу, когда вернётся/);
  });

  it('«Подтвердить» под deploy запускает обновление', async () => {
    startDeploy.mockResolvedValue();
    expect(await handleOpsCallback(encodeOpsCallback('deploy'))).toMatch(/Обновление запущено/);
    expect(startDeploy).toHaveBeenCalledTimes(1);
  });

  it('«Отмена» и устаревшая кнопка ничего не запускают', async () => {
    expect(await handleOpsCallback(encodeOpsCallback('cancel'))).toBe('Отменено.');
    const old = encodeOpsCallback('restart', 'nginx', Date.now() - 60 * 60 * 1000);
    expect(await handleOpsCallback(old)).toMatch(/устарело/);
    expect(await handleOpsCallback('ops:restart:nginx')).toMatch(/устарела/);
    expect(controlService).not.toHaveBeenCalled();
  });

  it('неизвестный сервис в кнопке не выполняется', async () => {
    expect(await handleOpsCallback(encodeOpsCallback('restart', 'sshd'))).toBe('Неизвестный сервис.');
    expect(controlService).not.toHaveBeenCalled();
  });
});
