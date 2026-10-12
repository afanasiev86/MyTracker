import { listClients as findClients, listProjectBriefs, runCostsByProject } from '../../services/store/index.js';

// GET /api/clients — клиенты со своими проектами и суммой затрат на Claude
export async function listClients(_req, res, next) {
  try {
    const [clients, projects, costs] = await Promise.all([findClients(), listProjectBriefs(), runCostsByProject()]);
    const costBySlug = Object.fromEntries(costs.map((c) => [c.project, c.costUsd]));

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
