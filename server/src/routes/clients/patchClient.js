import Client from '../../models/Client.js';
import { clientSchema } from './schemas.js';

// PATCH /api/clients/:id
export async function patchClient(req, res, next) {
  try {
    const patch = clientSchema.partial().parse(req.body);
    const client = await Client.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).lean();
    if (!client) return res.status(404).json({ error: 'Клиент не найден' });
    return res.json(client);
  } catch (err) {
    return next(err);
  }
}
