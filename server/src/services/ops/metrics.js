import os from 'node:os';
import fs from 'node:fs/promises';
import { getConfig } from '../../config.js';

const round = (n, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits;
const percent = (used, total) => (total ? Math.round((used / total) * 100) : 0);

// На Linux os.freemem() не учитывает кэш и завышает занятую память, поэтому берём MemAvailable
async function readMemory() {
  const total = os.totalmem();
  let available = os.freemem();
  try {
    const meminfo = await fs.readFile('/proc/meminfo', 'utf8');
    const kb = Number(/^MemAvailable:\s+(\d+) kB/m.exec(meminfo)?.[1]);
    if (kb) available = kb * 1024;
  } catch {
    // не Linux: остаётся os.freemem()
  }
  return { total, used: total - available };
}

async function readDisk() {
  try {
    const stat = await fs.statfs(getConfig().ops.appDir);
    const total = stat.blocks * stat.bsize;
    return { total, used: total - stat.bavail * stat.bsize };
  } catch {
    return null;
  }
}

// Нагрузка, память и диск раздела, где лежит трекер
export async function readMetrics() {
  const cores = os.cpus().length || 1;
  const [load1, load5, load15] = os.loadavg();
  const memory = await readMemory();
  const disk = await readDisk();
  return {
    uptimeSec: Math.round(os.uptime()),
    cpu: { cores, load: [load1, load5, load15].map((n) => round(n)), percent: Math.min(100, Math.round((load1 / cores) * 100)) },
    memory: { ...memory, percent: percent(memory.used, memory.total) },
    disk: disk && { ...disk, percent: percent(disk.used, disk.total) },
  };
}
