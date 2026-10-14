import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { slugify } from '../src/services/projects/slug.js';
import { isRepoUrl, ensureRepo } from '../src/services/projects/repo.js';

describe('код проекта из названия', () => {
  it('переводит кириллицу в латиницу', () => {
    expect(slugify('Магазин цветов')).toBe('magazin-tsvetov');
    expect(slugify('Щётка и ёжик')).toBe('schetka-i-ezhik');
  });

  it('оставляет латиницу и цифры, остальное заменяет дефисом', () => {
    expect(slugify('Shop API v2!')).toBe('shop-api-v2');
    expect(slugify('  --Мой  проект--  ')).toBe('moy-proekt');
  });

  it('для названия без букв и цифр даёт project, длину ограничивает', () => {
    expect(slugify('!!!')).toBe('project');
    expect(slugify('а'.repeat(100)).length).toBeLessThanOrEqual(40);
  });

  it('результат всегда подходит под SLUG_PATTERN', async () => {
    const { SLUG_PATTERN } = await import('../../shared/crm.js');
    for (const name of ['Магазин', '123', 'Тест_1', 'ЪЬ']) expect(SLUG_PATTERN.test(slugify(name))).toBe(true);
  });
});

describe('ссылка на репозиторий', () => {
  it.each([
    'https://github.com/owner/repo',
    'https://github.com/owner/repo.git',
    'git@github.com:owner/repo.git',
    'ssh://git@github.com/owner/repo.git',
  ])('принимает %s', (url) => expect(isRepoUrl(url)).toBe(true));

  it.each([
    '/etc/passwd',
    'file:///srv/repos/other',
    '--upload-pack=touch /tmp/x',
    'ext::sh -c touch% /tmp/x',
    'http://github.com/owner/repo',
    'https://github.com/owner/repo; rm -rf /',
    'owner/repo',
  ])('отклоняет %s', (url) => expect(isRepoUrl(url)).toBe(false));
});

describe('ensureRepo', () => {
  const saved = { ...process.env };
  let dir;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-repos-'));
    process.env.REPOS_DIR = dir;
  });
  afterEach(async () => {
    process.env = { ...saved };
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('без ссылки на репозиторий ничего не делает', async () => {
    expect(await ensureRepo({ slug: 'shop', repoUrl: '' })).toEqual({ status: 'none' });
  });

  it('не трогает уже существующую папку', async () => {
    await fs.mkdir(path.join(dir, 'shop'));
    expect(await ensureRepo({ slug: 'shop', repoUrl: 'https://github.com/owner/repo' })).toEqual({ status: 'exists' });
  });

  it('без REPOS_DIR клонирование пропускается', async () => {
    delete process.env.REPOS_DIR;
    expect(await ensureRepo({ slug: 'shop', repoUrl: 'https://github.com/owner/repo' })).toEqual({ status: 'none' });
  });
});
