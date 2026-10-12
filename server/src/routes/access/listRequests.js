import { listAccessRequests } from '../../services/access/listRequests.js';

// GET /api/access — запросы доступа, ожидающие решения владельца
export async function listRequests(_req, res, next) {
  try {
    return res.json(await listAccessRequests());
  } catch (err) {
    return next(err);
  }
}
