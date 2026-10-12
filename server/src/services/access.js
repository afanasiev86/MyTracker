// Фасад доступа к порталу: реализация разнесена по папке access/
export { startAccessRequest } from './access/startRequest.js';
export { listAccessRequests } from './access/listRequests.js';
export { approveAccessRequest } from './access/approveRequest.js';
export { rejectAccessRequest } from './access/rejectRequest.js';
export { revokePortal } from './access/revokePortal.js';
export { isPortalOpen } from './access/isPortalOpen.js';
