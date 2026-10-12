import Project from '../../models/Project.js';

// Проекты, которые принадлежат заказчику (только slug и название)
export async function clientProjects(clientId) {
  return Project.find({ client: clientId }).select('slug name').lean();
}
