import { Card, Col, Progress, Row, Typography } from 'antd';

const GB = 1024 ** 3;
const gb = (bytes) => (bytes / GB).toFixed(1);

// Зелёный, пока запас есть; жёлтый и красный, когда ресурс подходит к концу
const colorOf = (percent) => (percent >= 90 ? '#cf1322' : percent >= 75 ? '#d48806' : '#389e0d');

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} д ${hours} ч`;
  return hours > 0 ? `${hours} ч ${minutes} мин` : `${minutes} мин`;
}

function Meter({ title, percent, detail }) {
  return (
    <Col xs={24} md={8}>
      <Typography.Text type="secondary">{title}</Typography.Text>
      <Progress percent={percent} strokeColor={colorOf(percent)} aria-label={title} />
      <Typography.Text type="secondary">{detail}</Typography.Text>
    </Col>
  );
}

// Ресурсы сервера: нагрузка, память, диск и время работы
export default function MetricsCard({ metrics }) {
  const { cpu, memory, disk } = metrics;
  return (
    <Card title="Ресурсы" extra={<Typography.Text type="secondary">работает {formatUptime(metrics.uptimeSec)}</Typography.Text>} style={{ marginBottom: 16 }}>
      <Row gutter={[24, 16]}>
        <Meter title="Нагрузка" percent={cpu.percent} detail={`${cpu.load[0]} за минуту, ядер: ${cpu.cores}`} />
        <Meter title="Память" percent={memory.percent} detail={`${gb(memory.used)} из ${gb(memory.total)} ГБ`} />
        {disk && <Meter title="Диск" percent={disk.percent} detail={`${gb(disk.used)} из ${gb(disk.total)} ГБ`} />}
      </Row>
    </Card>
  );
}
