import { getConfig } from '../../config.js';
import { SERVICES } from './catalog.js';
import { run } from './exec.js';
import { opsAvailable } from './platform.js';

// Итоговые состояния: active | inactive | failed | activating | unknown
const SYSTEMD_STATES = new Set(['active', 'inactive', 'failed', 'activating', 'deactivating']);
const DOCKER_STATES = {
  running: 'active',
  exited: 'inactive',
  created: 'inactive',
  dead: 'failed',
  restarting: 'activating',
  paused: 'inactive',
};

export const composeArgs = (...rest) => ['compose', '--project-directory', getConfig().ops.appDir, ...rest];

async function systemdStatus(unit) {
  const res = await run('systemctl', ['is-active', unit]);
  const state = res.stdout.trim();
  return SYSTEMD_STATES.has(state) ? state : 'unknown';
}

async function composeStatus(service) {
  const ps = await run('docker', composeArgs('ps', '-a', '-q', service));
  if (!ps.ok) return 'unknown';
  const id = ps.stdout.trim().split('\n')[0];
  if (!id) return 'inactive';
  const inspect = await run('docker', ['inspect', '-f', '{{.State.Status}}', id]);
  return inspect.ok ? (DOCKER_STATES[inspect.stdout.trim()] ?? 'unknown') : 'unknown';
}

export async function serviceStatus(svc) {
  if (!opsAvailable()) return 'unknown';
  return svc.kind === 'systemd' ? systemdStatus(svc.unit) : composeStatus(svc.service);
}

export function listServices() {
  return Promise.all(SERVICES.map(async (svc) => ({
    id: svc.id,
    label: svc.label,
    actions: svc.actions,
    status: await serviceStatus(svc),
  })));
}
