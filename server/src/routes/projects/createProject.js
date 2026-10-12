import Project from '../../models/Project.js';
import { projectSchema } from './schemas.js';
import { normalize } from './helpers.js';

// POST /api/projects
export async function createProject(req, res, next) {
  try {
    const project = await Project.create(normalize(projectSchema.parse(req.body)));
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}
