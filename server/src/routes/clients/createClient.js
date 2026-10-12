import Client from '../../models/Client.js';
import { clientSchema } from './schemas.js';

// POST /api/clients
export async function createClient(req, res, next) {
  try {
    const client = await Client.create(clientSchema.parse(req.body));
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
}
