import { createProject as saveProject } from '../../services/store/index.js';
import { projectSchema } from './schemas.js';
import { normalize } from './helpers.js';

// POST /api/projects
export async function createProject(req, res, next) {
  try {
    const project = await saveProject(normalize(projectSchema.parse(req.body)));
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}
