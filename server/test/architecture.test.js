import { describe, it, expect } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Архитектурные правила из CLAUDE.md и решений бэклога. Проверяем по исходникам, без запуска кода.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');
const read = (file) => fs.readFileSync(file, 'utf8');

describe('фасады удалены (пункт 10 бэклога)', () => {
  const REMOVED = [
    'server/src/health.js',
    'server/src/services/access.js', 'server/src/services/attachments.js', 'server/src/services/auth.js',
    'server/src/services/digest.js', 'server/src/services/digestScheduler.js', 'server/src/services/portal.js',
    'server/src/services/runs.js', 'server/src/services/storage.js', 'server/src/services/telegram.js',
    'server/src/services/health.js', 'server/src/services/notify.js', 'server/src/services/clientNotify.js',
    'server/src/bot/commands.js', 'server/src/bot/callbacks.js', 'server/src/bot/poller.js',
    'server/src/worker/progress.js', 'server/src/worker/processes.js', 'server/src/worker/screenshots.js',
    'server/src/worker/verify.js', 'server/src/worker/queue.js',
    'client/src/lib/telegram.js', 'client/src/lib/templates.js',
  ];

  it.each(REMOVED)('%s не существует', (file) => {
    expect(fs.existsSync(path.join(ROOT, file))).toBe(false);
  });

  it('никто не импортирует удалённые фасады (относительный путь разрешается в точный файл)', () => {
    const removed = new Set(REMOVED.map((f) => path.join(ROOT, f)));
    const sources = [...walk(path.join(ROOT, 'server/src')), ...walk(path.join(ROOT, 'server/test')), ...walk(path.join(ROOT, 'client/src'))];
    const offenders = [];
    for (const file of sources) {
      for (const [, spec] of read(file).matchAll(/(?:import|export)[^'"]*from\s*'(\.[^']+)'|import\(\s*'(\.[^']+)'\s*\)/g)) {
        const target = path.resolve(path.dirname(file), spec || '');
        const resolved = [target, `${target}.js`, `${target}.jsx`];
        if (resolved.some((r) => removed.has(r))) offenders.push(`${rel(file)} -> ${spec}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('слой данных: маршруты не импортируют модели', () => {
  it('в server/src/routes нет импорта из models/', () => {
    const offenders = walk(path.join(ROOT, 'server/src/routes')).filter((f) => /from '[^']*models\//.test(read(f)));
    expect(offenders.map(rel)).toEqual([]);
  });
});

describe('конфигурация: process.env только в config.js и при передаче окружения процессу', () => {
  it('остальные файлы сервера не читают process.env', () => {
    const allowed = new Set(['server/src/config.js', 'server/src/worker/runTask.js', 'server/src/worker/verify/runCommand.js', 'server/src/services/projects/repo.js']);
    const offenders = walk(path.join(ROOT, 'server/src'))
      .map(rel)
      .filter((f) => !allowed.has(f) && read(path.join(ROOT, f)).includes('process.env'));
    expect(offenders).toEqual([]);
  });
});

describe('клиент: сетевые запросы только в слое api/, zod не попадает в бандл', () => {
  const clientFiles = walk(path.join(ROOT, 'client/src')).filter((f) => !/\.test\.jsx?$/.test(f));

  it('fetch( вызывается только в client/src/api/ и api.js', () => {
    const offenders = clientFiles
      .map(rel)
      .filter((f) => !f.startsWith('client/src/api/') && f !== 'client/src/api.js')
      .filter((f) => read(path.join(ROOT, f)).includes('fetch('));
    expect(offenders).toEqual([]);
  });

  it('клиент не импортирует zod и shared/contracts.js', () => {
    const offenders = clientFiles
      .map(rel)
      .filter((f) => /from '(zod|[^']*contracts\.js)'/.test(read(path.join(ROOT, f))));
    expect(offenders).toEqual([]);
  });
});

describe('контракт портала', () => {
  it('схема строгая: лишние поля отклоняются (проверка самой схемы)', async () => {
    const { PortalTaskSchema } = await import('../../shared/contracts.js');
    const base = {
      id: '1', project: 'p', title: 't', goal: '', acceptance: [], statusLabel: 'В работе',
      dueDate: null, comments: [],
    };
    expect(PortalTaskSchema.safeParse({ ...base, internalNote: 'секрет' }).success).toBe(false);
  });
});
