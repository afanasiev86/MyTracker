import AccessRequest from '../../models/AccessRequest.js';

// Ожидающие запросы доступа, по порядку поступления
export function listAccessRequests() {
  return AccessRequest.find({ status: 'pending' }).sort({ createdAt: 1 }).lean();
}
