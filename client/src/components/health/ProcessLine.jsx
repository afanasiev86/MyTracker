import { formatUptime } from './formatUptime.js';

// Сервер: время работы и занятая память
export default function ProcessLine({ proc }) {
  return (
    <p className="muted">
      Сервер работает {formatUptime(proc.uptimeSec)}, памяти {proc.rssMb} МБ.
    </p>
  );
}
