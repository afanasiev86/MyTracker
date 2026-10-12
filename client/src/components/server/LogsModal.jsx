import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Flex, Modal, Select } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { fetchServiceLogs } from '../../api.js';

const LINE_OPTIONS = [50, 100, 200].map((n) => ({ value: n, label: `${n} строк` }));

// Журнал выбранного сервиса: последние строки, можно обновить и выбрать объём
export default function LogsModal({ service, onClose }) {
  const [lines, setLines] = useState(50);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setText((await fetchServiceLogs(service.id, lines)).text);
    } catch (err) {
      setText('');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [service.id, lines]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Modal open footer={null} width={900} onCancel={onClose} title={`Журнал: ${service.label}`}>
      <Flex gap={8} style={{ marginBottom: 12 }}>
        <Select value={lines} onChange={setLines} options={LINE_OPTIONS} aria-label="Сколько строк" />
        <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>Обновить</Button>
      </Flex>
      {error && <Alert type="error" showIcon message={error} />}
      {!error && <pre className="ops-logs">{text || (loading ? 'Загружаем…' : 'Журнал пуст.')}</pre>}
    </Modal>
  );
}
