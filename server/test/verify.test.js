import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { projectChecks } from '../src/worker/verify/projectChecks.js';
import { formatChecks } from '../src/worker/verify/formatChecks.js';

async function projectWith(pkg) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'verify-test-'));
  if (pkg !== null) await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify(pkg));
  return dir;
}

describe('автопроверка: какие проверки запускать', () => {
  it('берёт только test и lint, которые объявлены в package.json', async () => {
    const dir = await projectWith({ scripts: { test: 'jest', lint: 'eslint .', build: 'vite build' } });
    expect(await projectChecks(dir)).toEqual(['test', 'lint']);
  });

  it('пропускает проверку, если скрипта нет', async () => {
    const dir = await projectWith({ scripts: { test: 'jest' } });
    expect(await projectChecks(dir)).toEqual(['test']);
  });

  it('возвращает пустой список, если package.json нет (проект не на npm)', async () => {
    const dir = await projectWith(null);
    expect(await projectChecks(dir)).toEqual([]);
  });
});

describe('автопроверка: текст результата', () => {
  it('перечисляет проверки с итогом и кодом возврата', () => {
    const text = formatChecks([
      { name: 'test', ok: true, code: 0, tail: '' },
      { name: 'lint', ok: false, code: 1, tail: '' },
    ]);
    expect(text).toBe('npm run test — пройдено; npm run lint — не пройдено (код 1)');
  });

  it('сообщает, если проверку не удалось подготовить', () => {
    const text = formatChecks([{ name: 'подготовка', ok: false, tail: 'нет сети' }]);
    expect(text).toBe('автопроверка не запущена: нет сети');
  });
});
