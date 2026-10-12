import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Alert } from 'antd';
import ClientForm from '../ClientForm.jsx';

// /clients/new и /clients/:id
export default function ClientRoute() {
  const { id } = useParams();
  const { clients, loaded, saved, remove } = useOutletContext();
  const navigate = useNavigate();

  if (!id) {
    return (
      <ClientForm
        key="new"
        client={null}
        onSaved={() => saved('Клиент добавлен')}
        onCancel={() => navigate('/clients')}
        onDelete={null}
      />
    );
  }

  if (!loaded) return null;
  const client = clients.find((c) => c._id === id);
  if (!client) return <Alert type="error" showIcon message="Клиент не найден" style={{ marginBottom: 12 }} />;

  return (
    <ClientForm
      key={client._id}
      client={client}
      onSaved={() => saved('Изменения сохранены')}
      onCancel={() => navigate('/clients')}
      onDelete={() => remove(client)}
    />
  );
}
