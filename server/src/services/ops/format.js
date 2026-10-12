const GB = 1024 ** 3;
const gb = (bytes) => (bytes / GB).toFixed(1);

export const STATUS_LABELS = {
  active: 'работает',
  inactive: 'остановлен',
  failed: 'сбой',
  activating: 'запускается',
  deactivating: 'останавливается',
  unknown: 'неизвестно',
};

export function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} д ${hours} ч`;
  return hours > 0 ? `${hours} ч ${minutes} мин` : `${minutes} мин`;
}

// Сводка для бота: ресурсы и состояние сервисов
export function formatStatus({ metrics, services, available }) {
  const { cpu, memory, disk } = metrics;
  const lines = [
    `Сервер работает ${formatUptime(metrics.uptimeSec)}`,
    `Нагрузка: ${cpu.load[0]} (${cpu.cores} яд., ${cpu.percent}%)`,
    `Память: ${gb(memory.used)} из ${gb(memory.total)} ГБ (${memory.percent}%)`,
  ];
  if (disk) lines.push(`Диск: ${gb(disk.used)} из ${gb(disk.total)} ГБ (${disk.percent}%)`);
  if (!available) {
    lines.push('', 'Состояние сервисов недоступно: сервер не на Linux.');
    return lines.join('\n');
  }
  lines.push('');
  for (const s of services) lines.push(`${s.status === 'active' ? '+' : '-'} ${s.label}: ${STATUS_LABELS[s.status] ?? s.status}`);
  return lines.join('\n');
}
