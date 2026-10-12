import Client from '../../models/Client.js';

// Проверка при каждом запросе портала: доступ могли закрыть уже после входа
export async function isPortalOpen(clientId) {
  const client = await Client.findById(clientId).select('portalApproved').lean();
  return Boolean(client?.portalApproved);
}
