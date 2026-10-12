import { spawn } from 'node:child_process';
import { registerRun } from './processes/registerRun.js';
import { unregisterRun } from './processes/unregisterRun.js';
import { stopRun } from './processes/stopRun.js';
import { progressFromEvent } from './progress/progressFromEvent.js';
import { parseStreamLine } from './progress/parseStreamLine.js';
import { LineSplitter } from './progress/LineSplitter.js';

// Не чаще раза в PROGRESS_THROTTLE_MS пишем прогресс в базу
const PROGRESS_THROTTLE_MS = 3000;

// Запускает claude и собирает вывод. Прогресс передаётся через onProgress (с троттлингом).
export function runClaude(bin, args, { cwd, env, taskId, timeoutMs, onProgress }) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, env });
    registerRun(taskId, child);
    const timer = setTimeout(() => stopRun(taskId, 'timeout'), timeoutMs);

    let stdout = '';
    let stderr = '';
    const splitter = new LineSplitter();
    let lastSent = 0;
    let pending = null;

    const handleLines = (lines) => {
      for (const line of lines) {
        const text = progressFromEvent(parseStreamLine(line));
        if (!text || !onProgress) continue;
        pending = text;
        const now = Date.now();
        if (now - lastSent >= PROGRESS_THROTTLE_MS) {
          lastSent = now;
          pending = null;
          onProgress(text);
        }
      }
    };

    child.stdout.on('data', (d) => {
      stdout += d;
      handleLines(splitter.push(String(d)));
    });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (err) => {
      clearTimeout(timer);
      unregisterRun(taskId);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      handleLines(splitter.flush());
      // Последнее сообщение могло прийти внутри окна троттлинга
      if (pending && onProgress) onProgress(pending);
      const entry = unregisterRun(taskId);
      resolve({ code, stdout, stderr, reason: entry?.reason ?? null });
    });
  });
}
