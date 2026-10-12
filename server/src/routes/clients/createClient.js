import { createClient as saveClient } from '../../services/store/index.js';
import { clientSchema } from './schemas.js';

// POST /api/clients
export async function createClient(req, res, next) {
  try {
    const client = await saveClient(clientSchema.parse(req.body));
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
}
