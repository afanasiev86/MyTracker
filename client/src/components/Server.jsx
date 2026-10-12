import { useState } from 'react';
import { Alert } from 'antd';
import Loading from './Loading.jsx';
import MetricsCard from './server/MetricsCard.jsx';
import ServicesCard from './server/ServicesCard.jsx';
import DeployCard from './server/DeployCard.jsx';
import { useOpsStatus } from './server/useOpsStatus.js';

// Раздел «Сервер»: ресурсы, сервисы, журналы и обновление. Управление работает только на Linux-сервере.
export default function Server() {
  const { state, error, setError, load } = useOpsStatus();
  const [notice, setNotice] = useState('');

  if (!state) {
    return error ? <Alert type="error" showIcon message={error} /> : <Loading text="Загрузка…" />;
  }

  const changed = (message) => {
    setError('');
    setNotice(message);
    load();
  };

  return (
    <>
      {notice && <Alert type="info" showIcon closable onClose={() => setNotice('')} message={notice} style={{ marginBottom: 16 }} />}
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      <MetricsCard metrics={state.metrics} />

      {state.available ? (
        <>
          <ServicesCard services={state.services} onChanged={changed} onError={setError} />
          <DeployCard deploy={state.deploy} onStarted={() => changed('Обновление запущено.')} onError={setError} />
        </>
      ) : (
        <Alert
          type="info"
          showIcon
          message="Управление сервисами, журналы и обновление доступны только на Linux-сервере. Здесь показаны только ресурсы этого компьютера."
        />
      )}
    </>
  );
}
