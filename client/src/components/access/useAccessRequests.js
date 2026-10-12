import { fetchAccessRequests, fetchClients } from '../../api.js';
import { useResource } from '../../lib/useResource.js';

// Запросы доступа и список клиентов. load() перечитывает оба списка.
const loadAccess = () =>
  Promise.all([fetchAccessRequests(), fetchClients()]).then(([reqs, list]) => ({
    requests: reqs ?? [],
    clients: list ?? [],
  }));

export function useAccessRequests() {
  const { data, error, setError, load } = useResource(loadAccess, { requests: [], clients: [] });
  return { requests: data.requests, clients: data.clients, error, setError, load };
}
