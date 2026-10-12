import Client from '../../models/Client.js';
import Project from '../../models/Project.js';
import Task from '../../models/Task.js';

// GET /api/clients — клиенты со своими проектами и суммой затрат на Claude
export async function listClients(_req, res, next) {
  try {
    const [clients, projects, costs] = await Promise.all([
      Client.find().sort({ name: 1 }).lean(),
      Project.find().select('slug name status client').lean(),
      Task.aggregate([
        { $unwind: '$runs' },
        { $group: { _id: '$project', costUsd: { $sum: '$runs.costUsd' } } },
      ]),
    ]);
    const costBySlug = Object.fromEntries(costs.map((c) => [c._id, c.costUsd]));

    res.json(clients.map((client) => {
      const own = projects.filter((p) => String(p.client) === String(client._id));
      return {
        ...client,
        projects: own.map((p) => ({ _id: p._id, slug: p.slug, name: p.name, status: p.status })),
        costUsd: own.reduce((sum, p) => sum + (costBySlug[p.slug] || 0), 0),
      };
    }));
  } catch (err) {
    next(err);
  }
}
