import { useEffect, useState } from 'react';
import { fetchAccessRequests, fetchClients } from '../../api.js';

// Запросы доступа и список клиентов. load() перечитывает оба списка.
export function useAccessRequests() {
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');

  function load() {
    Promise.resolve()
      .then(() => Promise.all([fetchAccessRequests(), fetchClients()]))
      .then(([reqs, list]) => {
        setRequests(reqs ?? []);
        setClients(list ?? []);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  return { requests, clients, error, setError, load };
}
