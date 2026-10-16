import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Снятие блокировок fail2ban: запускается только скрипт из ops-setup.sh, без оболочки и без аргументов от пользователя.
const run = jest.fn();
jest.unstable_mockModule('../src/services/ops/exec.js', () => ({ run }));
jest.unstable_mockModule('../src/services/ops/platform.js', () => ({ opsAvailable: () => true, assertOpsAvailable: () => {} }));

const { unbanSsh } = await import('../src/services/ops/unbanSsh.js');

beforeEach(() => run.mockReset());

describe('unbanSsh', () => {
  it('запускает через sudo -n только f2b-reset, без дополнительных аргументов', async () => {
    run.mockResolvedValue({ ok: true, stdout: '3\n', stderr: '', error: '' });
    await unbanSsh();
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0]).toBe('sudo');
    expect(run.mock.calls[0][1]).toEqual(['-n', '/usr/local/sbin/f2b-reset']);
  });

  it('возвращает число снятых адресов; пустой или нечисловой вывод — ноль', async () => {
    run.mockResolvedValueOnce({ ok: true, stdout: '3\n', stderr: '', error: '' });
    expect(await unbanSsh()).toBe(3);
    run.mockResolvedValueOnce({ ok: true, stdout: '', stderr: '', error: '' });
    expect(await unbanSsh()).toBe(0);
    run.mockResolvedValueOnce({ ok: true, stdout: 'ok\n', stderr: '', error: '' });
    expect(await unbanSsh()).toBe(0);
  });

  it('нет прав sudo или скрипта: понятное указание про ops-setup.sh', async () => {
    run.mockResolvedValueOnce({ ok: false, stdout: '', stderr: 'sudo: a password is required\n', error: 'x' });
    await expect(unbanSsh()).rejects.toThrow(/ops-setup\.sh/);
    run.mockResolvedValueOnce({ ok: false, stdout: '', stderr: 'sudo: /usr/local/sbin/f2b-reset: command not found\n', error: 'x' });
    await expect(unbanSsh()).rejects.toThrow(/ops-setup\.sh/);
  });

  it('прочие ошибки (например, fail2ban остановлен) показываются как есть, первой строкой', async () => {
    run.mockResolvedValue({ ok: false, stdout: '', stderr: 'ERROR Failed to access socket path\nвторая строка\n', error: 'x' });
    await expect(unbanSsh()).rejects.toThrow('ERROR Failed to access socket path');
  });
});
