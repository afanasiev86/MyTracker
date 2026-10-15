import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Сборка стенда: настоящие файлы в папке стенда и порядок шагов, всё внешнее (git, docker, Claude, база) подменено.
const findStandProject = jest.fn();
const ensureStand = jest.fn();
const syncStandRepo = jest.fn();
const readComposeConfig = jest.fn();
const composeUp = jest.fn();
const composeExec = jest.fn();
const makeRecipe = jest.fn();
const validateCompose = jest.fn();
jest.unstable_mockModule('../src/services/store/projects.js', () => ({ findStandProject }));
jest.unstable_mockModule('../src/services/uat/ensureStand.js', () => ({ ensureStand }));
jest.unstable_mockModule('../src/services/uat/syncStandRepo.js', () => ({ syncStandRepo }));
jest.unstable_mockModule('../src/services/uat/compose.js', () => ({ readComposeConfig, composeUp, composeExec }));
jest.unstable_mockModule('../src/services/uat/makeRecipe.js', () => ({ makeRecipe }));
jest.unstable_mockModule('../src/services/uat/validateCompose.js', () => ({ validateCompose }));

const { deployStand } = await import('../src/services/uat/deployStand.js');

const ok = (stdout = '') => ({ ok: true, stdout, stderr: '', error: '' });
const failed = (stderr) => ({ ok: false, stdout: '', stderr, error: 'x' });

describe('сборка стенда', () => {
  let root;
  let dir;
  const saved = { ...process.env };

  // Что делает Claude: кладёт рецепт в папку стенда
  const writeRecipe = async ({ dir: target }) => {
    await fs.writeFile(path.join(target, 'compose.yml'), 'services: {}');
    await fs.writeFile(path.join(target, 'stand.json'), JSON.stringify({ service: 'app', healthPath: '/api/health', seed: ['node', 'seed.js'] }));
  };

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-uat-'));
    process.env.UAT_DIR = root;
    dir = path.posix.join(root, 'shop');
    [findStandProject, ensureStand, syncStandRepo, readComposeConfig, composeUp, composeExec, makeRecipe, validateCompose].forEach((fn) => fn.mockReset());
    findStandProject.mockResolvedValue({ slug: 'shop', repoUrl: 'https://github.com/o/shop.git', uatBranch: 'uat' });
    ensureStand.mockResolvedValue({ host: 'shop.example.com', port: 4123 });
    syncStandRepo.mockResolvedValue('abc1234');
    readComposeConfig.mockResolvedValue({ config: { services: {} } });
    validateCompose.mockReturnValue([]);
    composeUp.mockResolvedValue(ok());
    composeExec.mockResolvedValue(ok());
    makeRecipe.mockImplementation(writeRecipe);
    global.fetch = jest.fn(async () => ({ status: 200 }));
  });

  afterEach(async () => {
    process.env = { ...saved };
    await fs.rm(root, { recursive: true, force: true });
  });

  it('первая сборка: Claude пишет рецепт, стенд поднимается, база наполняется один раз', async () => {
    const result = await deployStand('shop');

    expect(result).toEqual({ host: 'shop.example.com', commit: 'abc1234' });
    expect(makeRecipe).toHaveBeenCalledTimes(1);
    expect(composeUp).toHaveBeenCalledTimes(1);
    expect(composeExec).toHaveBeenCalledWith(dir, 'shop', 'app', ['node', 'seed.js']);
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:4123/api/health', expect.any(Object));
    const env = await fs.readFile(path.join(dir, '.env'), 'utf8');
    expect(env).toMatch(/UAT_PORT=4123/);
    expect(env).toMatch(/STAND_URL=https:\/\/shop\.example\.com/);
  });

  it('следующая сборка: рецепт не переписывается, seed не повторяется, пароли прежние', async () => {
    await deployStand('shop');
    const firstEnv = await fs.readFile(path.join(dir, '.env'), 'utf8');
    makeRecipe.mockClear();
    composeExec.mockClear();

    await deployStand('shop');

    expect(makeRecipe).not.toHaveBeenCalled();
    expect(composeExec).not.toHaveBeenCalled();
    expect(await fs.readFile(path.join(dir, '.env'), 'utf8')).toBe(firstEnv);
  });

  it('рецепт перестал собираться: Claude получает конец журнала и чинит его', async () => {
    await deployStand('shop');
    makeRecipe.mockClear();
    composeUp.mockResolvedValueOnce(failed('npm ERR! missing script: build')).mockResolvedValue(ok());

    await deployStand('shop');

    expect(makeRecipe).toHaveBeenCalledTimes(1);
    expect(makeRecipe.mock.calls[0][0].hint).toMatch(/missing script: build/);
  });

  it('рецепт нарушает правила и после исправления: ошибка с перечислением нарушений, не больше двух попыток Claude', async () => {
    validateCompose.mockReturnValue(['Сервис app: поле privileged запрещено']);

    await expect(deployStand('shop')).rejects.toThrow(/privileged запрещено/);

    expect(makeRecipe).toHaveBeenCalledTimes(2);
    expect(composeUp).not.toHaveBeenCalled();
  });

  it('второй рецепт Claude уже верный: стенд поднимается', async () => {
    validateCompose.mockReturnValueOnce(['Опубликован больше чем один порт']).mockReturnValue([]);

    await expect(deployStand('shop')).resolves.toMatchObject({ commit: 'abc1234' });

    expect(makeRecipe).toHaveBeenCalledTimes(2);
    expect(makeRecipe.mock.calls[1][0].hint).toMatch(/больше чем один порт/);
  });

  it('seed не удался: сборка считается неудачной, а повтор снова пробует наполнить базу', async () => {
    composeExec.mockResolvedValueOnce(failed('Cannot connect to Mongo'));

    await expect(deployStand('shop')).rejects.toThrow(/Наполнение базы не удалось: Cannot connect to Mongo/);

    await deployStand('shop');
    expect(composeExec).toHaveBeenCalledTimes(2);
  });

  it('рецепт без seed: база остаётся пустой, но первый запуск отмечен, и поздний seed ничего не сотрёт', async () => {
    makeRecipe.mockImplementation(async ({ dir: target }) => {
      await fs.writeFile(path.join(target, 'compose.yml'), 'services: {}');
      await fs.writeFile(path.join(target, 'stand.json'), JSON.stringify({ service: 'app' }));
    });
    await deployStand('shop');
    await fs.writeFile(path.join(dir, 'stand.json'), JSON.stringify({ service: 'app', seed: ['node', 'seed.js'] }));

    await deployStand('shop');

    expect(composeExec).not.toHaveBeenCalled();
  });

  it('приложение не отвечает: ошибка называет путь проверки', async () => {
    global.fetch = jest.fn(async () => { throw new Error('ECONNREFUSED'); });
    const timers = jest.spyOn(global, 'setTimeout').mockImplementation((callback) => { callback(); return 0; });
    const err = await deployStand('shop').catch((e) => e);
    timers.mockRestore();

    expect(err.message).toMatch(/не ответило на \/api\/health: ECONNREFUSED/);
  });

  it('у проекта нет репозитория: понятная причина', async () => {
    findStandProject.mockResolvedValue({ slug: 'shop', repoUrl: '' });
    await expect(deployStand('shop')).rejects.toThrow(/не указан репозиторий/);
  });
});
