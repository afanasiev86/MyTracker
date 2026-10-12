#!/usr/bin/env node
// Ссылки на строки в документации: авторы пишут якоря, скрипт подставляет номера строк.
//
// Якоря (в обратных кавычках, путь от корня репозитория):
//   `server/src/services/runs.js#startTask`   — объявление функции/константы/маршрута по имени
//   `server/src/worker/runTask.js@--resume`   — строка, содержащая текст (первая подходящая)
//   `docs/features/tasks.md#Статусы`          — заголовок документа с таким текстом
//
// Скрипт заменяет якорь на ссылку с номерами, например:
//   `server/src/services/runs.js:L7-16#startTask`, `server/src/worker/runTask.js:L134@--resume`, `docs/x.md:L5#Статусы`
//
// Команды:
//   node scripts/docs/refs.mjs build   — переписывает docs/**/*.md с актуальными номерами
//   node scripts/docs/refs.mjs check   — падает, если номера в документах устарели или якорь не найден
//   node scripts/docs/refs.mjs index <файл...> — печатает объявления файла с диапазонами строк
//
// Замена не добавляет и не убирает строк, поэтому номера строк документа остаются точными.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Ссылка: путь, необязательные номера (:Lnn или :Lnn-mm), разделитель # или @, якорь
const TOKEN = /`((?:[\w.-]+\/)*[\w.-]+\.(?:js|jsx|md|sh|json|yml|service|conf))(?::L\d+(?:-\d+)?)?([#@])([^`]+)`/g;

const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'function']);

// Убирает содержимое строк и комментарии, чтобы скобки внутри них не учитывались
function stripStrings(line) {
  return line
    .replace(/\/\/.*$/, '')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

// Конец объявления, начинающегося в строке start (1-based): по балансу скобок
export function declarationEnd(lines, start) {
  let depth = 0;
  let seenBrace = false;
  for (let i = start - 1; i < lines.length; i += 1) {
    const text = stripStrings(lines[i]);
    for (const ch of text) {
      if (ch === '{' || ch === '(' || ch === '[') {
        depth += 1;
        if (ch === '{') seenBrace = true;
      } else if (ch === '}' || ch === ')' || ch === ']') {
        depth -= 1;
      }
    }
    if (depth <= 0 && (seenBrace || text.trimEnd().endsWith(';'))) return i + 1;
  }
  return start;
}

const DECL = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\b|const\b|let\b|class\b)\s*\*?\s*([A-Za-z_$][\w$]*)|^\s{2}(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(.*\)\s*\{/;
const ROUTE = /^router\.(get|post|patch|delete)\('([^']*)'/;

// Объявления файла: имя и диапазон строк
export function symbolIndex(lines) {
  const out = [];
  lines.forEach((line, idx) => {
    const route = ROUTE.exec(line);
    if (route) {
      out.push({ name: `${route[1].toUpperCase()} ${route[2]}`, start: idx + 1, end: declarationEnd(lines, idx + 1) });
      return;
    }
    const m = DECL.exec(line);
    if (!m) return;
    const name = m[1] || m[2];
    if (KEYWORDS.has(name)) return;
    out.push({ name, start: idx + 1, end: declarationEnd(lines, idx + 1) });
  });
  return out;
}

const cache = new Map();
function fileLines(rel) {
  if (!cache.has(rel)) {
    const abs = path.resolve(ROOT, rel);
    if (!fs.existsSync(abs)) return null;
    cache.set(rel, fs.readFileSync(abs, 'utf8').split('\n'));
  }
  return cache.get(rel);
}

function resolveToken(rel, sep, label) {
  const lines = fileLines(rel);
  if (!lines) throw new Error(`файл не найден: ${rel}`);

  if (rel.endsWith('.md')) {
    if (sep !== '#') throw new Error(`для документа нужен якорь #заголовок: ${rel}@${label}`);
    const idx = lines.findIndex((l) => /^#+\s/.test(l) && l.replace(/^#+\s+/, '').trim() === label.trim());
    if (idx < 0) throw new Error(`в ${rel} нет заголовка «${label}»`);
    return `${rel}:L${idx + 1}#${label}`;
  }

  if (sep === '@') {
    const idx = lines.findIndex((l) => l.includes(label));
    if (idx < 0) throw new Error(`в ${rel} нет строки с текстом «${label}»`);
    return `${rel}:L${idx + 1}@${label}`;
  }

  const decl = symbolIndex(lines).find((s) => s.name === label);
  if (!decl) throw new Error(`в ${rel} нет объявления «${label}»`);
  return `${rel}:L${decl.start}-${decl.end}#${label}`;
}

// Заменяет якоря в тексте. Число строк не меняется.
export function resolveText(text) {
  const errors = [];
  const out = text.replace(TOKEN, (whole, rel, sep, label) => {
    try {
      return `\`${resolveToken(rel, sep, label)}\``;
    } catch (err) {
      errors.push(err.message);
      return whole;
    }
  });
  return { text: out, errors };
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

function run(mode) {
  const docs = walk(path.join(ROOT, 'docs'));
  let changed = 0;
  const errors = [];

  for (const doc of docs) {
    const rel = path.relative(ROOT, doc);
    const original = fs.readFileSync(doc, 'utf8');
    const { text, errors: fileErrors } = resolveText(original);
    fileErrors.forEach((e) => errors.push(`${rel}: ${e}`));
    if (text === original) continue;
    changed += 1;
    if (mode === 'build') fs.writeFileSync(doc, text);
    else errors.push(`${rel}: номера строк устарели, запустите npm run docs:build`);
  }

  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(mode === 'build'
    ? `Обновлено файлов: ${changed}`
    : `Ссылки в документации актуальны (${docs.length} файлов)`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const mode = process.argv[2];
  if (mode === 'build' || mode === 'check') {
    run(mode);
  } else if (mode === 'index') {
    for (const file of process.argv.slice(3)) {
      for (const s of symbolIndex(fileLines(file))) console.log(`${file}:L${s.start}-${s.end}#${s.name}`);
    }
  } else {
    console.log('Использование: refs.mjs build | check | index <файл...>');
    process.exit(1);
  }
}
