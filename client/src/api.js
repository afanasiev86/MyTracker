// Фасад API клиента: все запросы к серверу разнесены по папке api/.
// Компоненты импортируют отсюда, поэтому пути к модулям знать не нужно.
export * from './api/session.js';
export * from './api/auth.js';
export * from './api/tasks.js';
export * from './api/attachments.js';
export * from './api/projects.js';
export * from './api/clients.js';
export * from './api/stats.js';
export * from './api/storage.js';
export * from './api/health.js';
export * from './api/access.js';
export * from './api/portal.js';
