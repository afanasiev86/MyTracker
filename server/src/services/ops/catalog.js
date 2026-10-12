// Что можно делать с сервером из интерфейса и бота. Только этот список: произвольных команд нет.
// kind systemd — юнит systemctl, compose — сервис из docker-compose.yml трекера.
// self: сервис, внутри которого работает сам API (остановить его отсюда нельзя, чтобы не потерять управление).
export const SERVICES = [
  { id: 'mytracker-api', label: 'API трекера', kind: 'systemd', unit: 'mytracker-api', actions: ['restart'], self: true },
  { id: 'nginx', label: 'nginx', kind: 'systemd', unit: 'nginx', actions: ['restart', 'start', 'stop'] },
  { id: 'docker', label: 'Docker', kind: 'systemd', unit: 'docker', actions: [] },
  { id: 'mongo', label: 'MongoDB', kind: 'compose', service: 'mongo', actions: ['restart', 'start', 'stop'] },
  { id: 'minio', label: 'MinIO', kind: 'compose', service: 'minio', actions: ['restart', 'start', 'stop'] },
];

export const ACTION_LABELS = { restart: 'перезапущен', start: 'запущен', stop: 'остановлен' };

export const findService = (id) => SERVICES.find((s) => s.id === id);
