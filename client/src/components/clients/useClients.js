import { fetchClients } from '../../api.js';
import { useResource } from '../../lib/useResource.js';

// Список клиентов. load() перечитывает список с сервера.
export function useClients() {
  const { data, loaded, error, setError, load } = useResource(fetchClients, []);
  return { clients: data, loaded, error, setError, load };
}
