// Фасад авторизации: реализация разнесена по папке auth/
export { checkPassword } from './auth/password.js';
export { currentTokenVersion, revokeAllTokens } from './auth/tokenVersion.js';
export { issueToken, verifyToken } from './auth/tokens.js';
