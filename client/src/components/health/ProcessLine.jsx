import { Typography } from 'antd';
import { formatUptime } from './formatUptime.js';

// Сервер: время работы и занятая память
export default function ProcessLine({ proc }) {
  return (
    <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
      Сервер работает {formatUptime(proc.uptimeSec)}, памяти {proc.rssMb} МБ.
    </Typography.Paragraph>
  );
}
