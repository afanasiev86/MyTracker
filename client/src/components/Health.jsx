import { Alert, Button, Card } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useHealthDetails } from './health/useHealthDetails.js';
import ChecksList from './health/ChecksList.jsx';
import RunsSummary from './health/RunsSummary.jsx';
import ProcessLine from './health/ProcessLine.jsx';
import Loading from './Loading.jsx';

// Состояние сервисов и запусков Claude. Видно только владельцу, обновляется каждые 30 секунд.
export default function Health() {
  const { data, error, load } = useHealthDetails();

  if (!data) {
    return (
      <Card title="Состояние" style={{ marginBottom: 16 }}>
        {error ? <Alert type="error" showIcon message={error} /> : <Loading text="Загрузка…" />}
      </Card>
    );
  }

  const { checks, worker, sessions, process: proc } = data;

  return (
    <Card
      title="Состояние"
      aria-label="Состояние сервисов"
      style={{ marginBottom: 16 }}
      extra={<Button icon={<ReloadOutlined />} onClick={load}>Обновить</Button>}
    >
      <ChecksList checks={checks} />
      <RunsSummary sessions={sessions} worker={worker} />
      <ProcessLine proc={proc} />
      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 12 }} />}
    </Card>
  );
}
