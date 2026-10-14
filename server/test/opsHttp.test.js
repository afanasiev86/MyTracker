import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';

// Раздел «Сервер» через HTTP без системы: настоящие маршруты и сервисы, подменены только запуск команд и платформа.
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD = 'test-password';

const run = jest.fn();
jest.unstable_mockModule('../src/services/ops/exec.js', () => ({ run }));
jest.unstable_mockModule('../src/services/ops/platform.js', () => ({
  opsAvailable: () => true,
  assertOpsAvailable: () => {},
}));
jest.unstable_mockModule('../src/services/ops/notice.js', () => ({
  writeNotice: jest.fn(async () => {}),
  reportPendingNotice: jest.fn(async () => {}),
  opsFile: (name) => `/nonexistent/.ops/${name}`,
}));
jest.unstable_mockModule('../src/services/auth/tokenVersion.js', () => ({
  currentTokenVersion: async () => 1,
  revokeAllTokens: jest.fn(async () => 2),
}));

const request = (await import('supertest')).default;
const { createApp } = await import('../src/app.js');
const { issueToken } = await import('../src/services/auth/tokens.js');
const { stoppedOnPurpose } = await import('../src/services/ops/control.js');

const ok = (stdout = '') => ({ ok: true, stdout, stderr: '', error: '' });
const fail = (stderr) => ({ ok: false, stdout: '', stderr, error: 'Command failed' });

let owner;
let client;
beforeAll(async () => {
  owner = await issueToken('owner');
  client = await issueToken('client:1', '1h', { role: 'client', clientId: '1' });
});

beforeEach(() => {
  run.mockReset();
  run.mockResolvedValue(ok('active\n'));
  stoppedOnPurpose.clear();
});

const api = (method, path, auth = owner) => request(createApp())[method](`/api/ops${path}`).set('Authorization', `Bearer ${auth}`);

describe('/api/ops: доступ', () => {
  it('закрыт без токена и для заказчика', async () => {
    expect((await request(createApp()).get('/api/ops')).status).toBe(401);
    expect((await api('get', '', client)).status).toBe(403);
    expect((await api('post', '/services/nginx/restart', client)).status).toBe(403);
    expect((await api('post', '/deploy', client)).status).toBe(403);
  });
});

describe('/api/ops: состояние', () => {
  it('отдаёт метрики и состояние сервисов из каталога', async () => {
    const res = await api('get', '');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.metrics.memory.total).toBeGreaterThan(0);
    expect(res.body.services.map((s) => s.id)).toEqual(['mytracker-api', 'nginx', 'docker', 'mongo']);
    expect(res.body.services.find((s) => s.id === 'nginx')).toMatchObject({ status: 'active', actions: ['restart', 'start', 'stop'] });
  });
});

describe('/api/ops: действия над сервисами', () => {
  it('запускает только команду из каталога, без оболочки и с точными аргументами', async () => {
    const res = await api('post', '/services/nginx/restart');
    expect(res.status).toBe(200);
    const call = run.mock.calls.find(([cmd, args]) => cmd === 'sudo' && args.includes('restart'));
    expect(call[1]).toEqual(['-n', '/usr/bin/systemctl', 'restart', 'nginx']);
  });

  it('сервис compose управляется через docker compose', async () => {
    await api('post', '/services/mongo/restart');
    const call = run.mock.calls.find(([cmd, args]) => cmd === 'docker' && args.includes('restart'));
    expect(call[1].slice(-2)).toEqual(['restart', 'mongo']);
  });

  it('неизвестный сервис и неизвестное действие отклоняются, команда не запускается', async () => {
    expect((await api('post', '/services/sshd/restart')).status).toBe(404);
    expect((await api('post', '/services/nginx/reboot')).status).toBe(400);
    expect((await api('post', '/services/nginx/restart;rm')).status).toBe(400);
    expect(run).not.toHaveBeenCalled();
  });

  it('API и Docker нельзя остановить: действие недоступно', async () => {
    expect((await api('post', '/services/mytracker-api/stop')).status).toBe(400);
    expect((await api('post', '/services/docker/restart')).status).toBe(400);
    expect(run).not.toHaveBeenCalled();
  });

  it('перезапуск самого API откладывается, чтобы ответ успел уйти', async () => {
    jest.useFakeTimers();
    try {
      const res = await api('post', '/services/mytracker-api/restart');
      expect(res.body).toMatchObject({ scheduled: true });
      expect(run).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1500);
      expect(run).toHaveBeenCalledWith('sudo', ['-n', '/usr/bin/systemctl', 'restart', 'mytracker-api']);
    } finally {
      jest.useRealTimers();
    }
  });

  it('без прав sudo объясняет, что делать', async () => {
    run.mockResolvedValue(fail('sudo: a password is required'));
    const res = await api('post', '/services/nginx/restart');
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/ops-setup\.sh/);
  });

  it('остановленный владельцем сервис запоминается, запуск снимает отметку', async () => {
    await api('post', '/services/nginx/stop');
    expect(stoppedOnPurpose.has('nginx')).toBe(true);
    await api('post', '/services/nginx/start');
    expect(stoppedOnPurpose.has('nginx')).toBe(false);
  });
});

describe('/api/ops: журналы', () => {
  it('читает ограниченное число строк журнала сервиса', async () => {
    run.mockResolvedValue(ok('строка 1\nстрока 2\n'));
    const res = await api('get', '/services/nginx/logs?lines=99999');
    expect(res.body.text).toBe('строка 1\nстрока 2');
    expect(run).toHaveBeenCalledWith('journalctl', ['-u', 'nginx', '-n', '200', '--no-pager', '-o', 'short-iso']);
  });

  it('неизвестный сервис: 404 и без запуска команд', async () => {
    expect((await api('get', '/services/etc-passwd/logs')).status).toBe(404);
    expect(run).not.toHaveBeenCalled();
  });

  it('ошибка чтения журнала показывает причину', async () => {
    run.mockResolvedValue(fail('journalctl: permission denied'));
    const res = await api('get', '/services/nginx/logs');
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/permission denied/);
  });
});

describe('/api/ops: обновление', () => {
  it('запускает deploy/update.sh вне процесса API через systemd-run', async () => {
    const res = await api('post', '/deploy');
    expect(res.status).toBe(202);
    const call = run.mock.calls.find(([cmd]) => cmd === 'sudo');
    expect(call[1].slice(0, 3)).toEqual(['-n', '/usr/bin/systemd-run', '--unit=mytracker-deploy']);
    expect(call[1]).toContain('--collect');
    expect(call[1].at(-1)).toMatch(/deploy[\\/]update\.sh$/);
  });

  it('без прав sudo объясняет, что делать', async () => {
    run.mockResolvedValue(fail('sudo: a password is required'));
    const res = await api('post', '/deploy');
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/ops-setup\.sh/);
  });
});
