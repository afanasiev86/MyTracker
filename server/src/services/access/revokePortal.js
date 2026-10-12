import Client from '../../models/Client.js';

// Закрыть портал клиенту: токены заказчика перестанут открывать его данные
export async function revokePortal(clientId) {
  const client = await Client.findByIdAndUpdate(
    clientId,
    { $unset: { telegramId: 1 }, $set: { portalApproved: false } },
    { new: true },
  ).lean();
  return Boolean(client);
}
