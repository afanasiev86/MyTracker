import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { githubFullName, toRepoInfo, listRepos, createRepo } from '../src/services/github/repos.js';
import { githubRequest } from '../src/services/github/api.js';
import { syncWithGithub } from '../src/services/projects/githubSync.js';

const realFetch = global.fetch;
const realToken = process.env.GITHUB_TOKEN;

function mockFetch(handler) {
  global.fetch = jest.fn(async (url, opts) => {
    const { status = 200, body = {} } = await handler(url, opts);
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  });
  return global.fetch;
}

afterEach(() => {
  global.fetch = realFetch;
  if (realToken === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = realToken;
});

describe('ссылка на репозиторий GitHub', () => {
  it.each([
    ['https://github.com/owner/repo', 'owner/repo'],
    ['https://github.com/owner/repo.git', 'owner/repo'],
    ['git@github.com:owner/repo.git', 'owner/repo'],
    ['ssh://git@github.com/owner/repo.git', 'owner/repo'],
  ])('разбирает %s', (url, full) => expect(githubFullName(url)).toBe(full));

  it.each(['', 'https://gitlab.com/owner/repo', 'git@example.com:owner/repo.git', '/srv/repos/x'])(
    'не считает %s репозиторием GitHub',
    (url) => expect(githubFullName(url)).toBeNull(),
  );
});

describe('поля репозитория', () => {
  it('берёт только нужное и подставляет значения по умолчанию', () => {
    const info = toRepoInfo({ full_name: 'o/r', name: 'r', description: null, private: true, archived: false, default_branch: 'dev', pushed_at: '2026-10-01T00:00:00Z', ssh_url: 'git@github.com:o/r.git', owner: { id: 1 } });
    expect(info).toEqual({
      fullName: 'o/r', name: 'r', description: '', private: true, archived: false,
      defaultBranch: 'dev', pushedAt: '2026-10-01T00:00:00Z', sshUrl: 'git@github.com:o/r.git',
    });
  });
});

describe('запросы к GitHub', () => {
  it('без токена не ходит в сеть и сообщает, что GitHub не подключён', async () => {
    delete process.env.GITHUB_TOKEN;
    const fetchSpy = mockFetch(() => ({ body: [] }));
    await expect(githubRequest('GET', '/user/repos')).rejects.toMatchObject({ code: 'unavailable' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('шлёт токен в заголовке и не возвращает его в ошибке', async () => {
    process.env.GITHUB_TOKEN = 'secret-token';
    mockFetch(() => ({ status: 401, body: { message: 'Bad credentials' } }));
    const err = await githubRequest('GET', '/user/repos').catch((e) => e);
    expect(err.code).toBe('unavailable');
    expect(err.message).toBe('GitHub: Bad credentials');
    expect(err.message).not.toContain('secret-token');
  });

  it('404 превращает в not_found, 422 в conflict', async () => {
    process.env.GITHUB_TOKEN = 't';
    mockFetch(() => ({ status: 404, body: {} }));
    await expect(githubRequest('GET', '/repos/a/b')).rejects.toMatchObject({ code: 'not_found' });
    mockFetch(() => ({ status: 422, body: { message: 'Validation Failed', errors: [{ message: 'name already exists' }] } }));
    await expect(githubRequest('POST', '/user/repos', {})).rejects.toMatchObject({ code: 'conflict', message: 'GitHub: name already exists' });
  });

  it('список репозиториев идёт по страницам до неполной', async () => {
    process.env.GITHUB_TOKEN = 't';
    const page1 = Array.from({ length: 100 }, (_, i) => ({ full_name: `o/r${i}`, name: `r${i}`, ssh_url: `git@github.com:o/r${i}.git` }));
    const page2 = [{ full_name: 'o/last', name: 'last', ssh_url: 'git@github.com:o/last.git' }];
    const fetchSpy = mockFetch((url) => ({ body: /[?&]page=1(&|$)/.test(url) ? page1 : page2 }));
    const repos = await listRepos();
    expect(repos).toHaveLength(101);
    expect(repos.at(-1).fullName).toBe('o/last');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('создаёт приватный репозиторий с веткой main и без пустого описания', async () => {
    process.env.GITHUB_TOKEN = 't';
    const fetchSpy = mockFetch(() => ({ body: { full_name: 'o/shop', name: 'shop', ssh_url: 'git@github.com:o/shop.git', default_branch: 'main' } }));
    const repo = await createRepo({ name: 'shop', description: '' });
    const sent = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(sent).toEqual({ name: 'shop', private: true, auto_init: true });
    expect(repo.sshUrl).toBe('git@github.com:o/shop.git');
  });
});

describe('синхронизация проекта с GitHub', () => {
  const base = { _id: 'id1', slug: 'shop', description: '', status: 'active', repoUrl: '' };

  function fakeDeps({ enabled = true, stored = base, ...overrides } = {}) {
    const calls = { save: [], updateRepo: [] };
    const deps = {
      // Сохранение сливает патч с уже сохранённым проектом, как это делает база
      save: jest.fn(async (id, patch) => { stored = { ...stored, ...patch }; return stored; }),
      github: {
        enabled: () => enabled,
        fullName: githubFullName,
        createRepo: jest.fn(async () => ({ fullName: 'o/shop', sshUrl: 'git@github.com:o/shop.git', defaultBranch: 'main' })),
        getRepo: jest.fn(async () => ({ fullName: 'o/x', description: 'из GitHub', defaultBranch: 'develop' })),
        updateRepo: jest.fn(async (full, patch) => { calls.updateRepo.push([full, patch]); return {}; }),
        ...overrides,
      },
    };
    return { deps, calls };
  }

  it('без GITHUB_TOKEN ничего не делает', async () => {
    const { deps } = fakeDeps({ enabled: false });
    const res = await syncWithGithub(base, { created: true }, deps);
    expect(res.github.status).toBe('disabled');
    expect(deps.github.createRepo).not.toHaveBeenCalled();
  });

  it('новый проект без ссылки получает приватный репозиторий и ссылку на него', async () => {
    const { deps } = fakeDeps();
    const res = await syncWithGithub(base, { created: true }, deps);
    expect(deps.github.createRepo).toHaveBeenCalledWith({ name: 'shop', description: '' });
    expect(res.project.repoUrl).toBe('git@github.com:o/shop.git');
    expect(res.github).toEqual({ status: 'created', fullName: 'o/shop' });
  });

  it('при смене ссылки подтягивает основную ветку и пустое описание из GitHub', async () => {
    const { deps } = fakeDeps();
    const project = { ...base, repoUrl: 'git@github.com:o/x.git' };
    const res = await syncWithGithub(project, { pull: true }, deps);
    expect(res.project.defaultBranch).toBe('develop');
    expect(res.project.description).toBe('из GitHub');
  });

  it('непустое описание в CRM не перезаписывается описанием из GitHub', async () => {
    const project = { ...base, repoUrl: 'git@github.com:o/x.git', description: 'Своё' };
    const { deps } = fakeDeps({ stored: project });
    const res = await syncWithGithub(project, { pull: true }, deps);
    expect(res.project.description).toBe('Своё');
    expect(deps.github.updateRepo).toHaveBeenCalledWith('o/x', { description: 'Своё', archived: false });
  });

  it('статус «Завершён» архивирует репозиторий, другой статус снимает архивацию', async () => {
    const { deps, calls } = fakeDeps();
    await syncWithGithub({ ...base, repoUrl: 'git@github.com:o/x.git', status: 'done' }, {}, deps);
    await syncWithGithub({ ...base, repoUrl: 'git@github.com:o/x.git', status: 'paused' }, {}, deps);
    expect(calls.updateRepo.map(([, p]) => p.archived)).toEqual([true, false]);
  });

  it('ссылка не на GitHub не трогает GitHub', async () => {
    const { deps } = fakeDeps();
    const res = await syncWithGithub({ ...base, repoUrl: 'https://gitlab.com/o/x' }, { pull: true }, deps);
    expect(res.github.status).toBe('none');
    expect(deps.github.getRepo).not.toHaveBeenCalled();
  });

  it('ошибка GitHub сохраняет проект и возвращает текст ошибки', async () => {
    const { deps } = fakeDeps({
      createRepo: jest.fn(async () => { throw new Error('GitHub: name already exists'); }),
    });
    const res = await syncWithGithub(base, { created: true }, deps);
    expect(res.github).toEqual({ status: 'failed', error: 'GitHub: name already exists' });
    expect(res.project).toEqual(base);
  });
});
