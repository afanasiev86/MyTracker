import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Запуск стенда по кнопке и забор ветки UAT. База, очередь сборок и git подменены.
process.env.UAT_DOMAIN = 'example.com';
const findStandProject = jest.fn();
const saveStandState = jest.fn(async () => {});
const requestDeploy = jest.fn();
const opsAvailable = jest.fn(() => true);
const git = jest.fn();
const ensureRemoteBranch = jest.fn(async () => {});
jest.unstable_mockModule('../src/services/store/projects.js', () => ({ findStandProject, saveStandState }));
jest.unstable_mockModule('../src/services/uat/requestDeploy.js', () => ({ requestDeploy }));
jest.unstable_mockModule('../src/services/ops/platform.js', () => ({ opsAvailable }));
jest.unstable_mockModule('../src/worker/git.js', () => ({ git }));
jest.unstable_mockModule('../src/worker/worktree.js', () => ({ ensureRemoteBranch }));

const { startStand } = await import('../src/services/uat/startStand.js');
const { syncStandRepo } = await import('../src/services/uat/syncStandRepo.js');

const project = (over = {}) => ({ slug: 'shop', repoUrl: 'https://github.com/o/shop.git', commitToBase: false, ...over });

beforeEach(() => {
  [findStandProject, saveStandState, requestDeploy, git, ensureRemoteBranch].forEach((fn) => fn.mockClear());
  opsAvailable.mockReturnValue(true);
  findStandProject.mockResolvedValue(project());
  delete process.env.UAT_DOMAIN;
  process.env.UAT_DOMAIN = 'example.com';
});

describe('запуск стенда по кнопке', () => {
  it('ставит статус «собирается» и запускает сборку', async () => {
    await startStand('shop');

    expect(saveStandState).toHaveBeenCalledWith('shop', { uatStatus: 'building', uatError: '' });
    expect(requestDeploy).toHaveBeenCalledWith('shop');
  });

  it.each([
    ['нет проекта', () => findStandProject.mockResolvedValue(null), 'not_found'],
    ['проект пушит сразу в ПРОД', () => findStandProject.mockResolvedValue(project({ commitToBase: true })), 'conflict'],
    ['нет репозитория', () => findStandProject.mockResolvedValue(project({ repoUrl: '' })), 'conflict'],
    ['UAT выключен', () => { delete process.env.UAT_DOMAIN; }, 'unavailable'],
    ['не Linux-сервер', () => opsAvailable.mockReturnValue(false), 'unavailable'],
  ])('отказ: %s', async (_name, setup, code) => {
    setup();

    await expect(startStand('shop')).rejects.toMatchObject({ code });

    expect(saveStandState).not.toHaveBeenCalled();
    expect(requestDeploy).not.toHaveBeenCalled();
  });
});

describe('забор ветки UAT в папку стенда', () => {
  it('первая сборка: клон, создание ветки UAT от основной, переход на неё', async () => {
    git.mockImplementation(async (cwd, args) => (args[0] === 'rev-parse' ? 'abc1234\n' : ''));

    const commit = await syncStandRepo('/srv/uat/shop', { repoUrl: 'https://github.com/o/shop.git', uatBranch: 'uat', base: 'main' });

    expect(commit).toBe('abc1234');
    expect(git.mock.calls[0][1]).toEqual(expect.arrayContaining(['clone', '--', 'https://github.com/o/shop.git', 'repo']));
    expect(ensureRemoteBranch).toHaveBeenCalledWith('/srv/uat/shop/repo', 'uat', 'main');
    expect(git).toHaveBeenCalledWith('/srv/uat/shop/repo', ['checkout', '-f', '-B', 'uat', 'origin/uat']);
  });
});
