import { findProject } from '../../services/store/index.js';
import { ensureRepo } from '../../services/projects/repo.js';
import { syncWithGithub } from '../../services/projects/githubSync.js';
import { domainError } from '../../services/errors.js';

// POST /api/projects/:id/sync-github — подтянуть из GitHub основную ветку и описание, отправить описание и статус
export async function syncProject(req, res, next) {
  try {
    const found = await findProject(req.params.id);
    if (!found) throw domainError('not_found', 'Проект не найден');
    const sync = await syncWithGithub(found.toObject(), { pull: true });
    return res.json({ ...sync.project, repo: await ensureRepo(sync.project), github: sync.github });
  } catch (err) {
    return next(err);
  }
}
