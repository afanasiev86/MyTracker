import Client from '../../models/Client.js';

// Доступ к клиентам в базе
export function listClients() {
  return Client.find().sort({ name: 1 }).lean();
}

export function createClient(data) {
  return Client.create(data);
}

export function updateClient(id, patch) {
  return Client.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).lean();
}

export function deleteClientById(id) {
  return Client.deleteOne({ _id: id });
}

export function findClientByTelegramId(telegramId) {
  return Client.findOne({ telegramId }).select('_id portalApproved').lean();
}

export function findClientName(id) {
  return Client.findById(id).select('name').lean();
}
