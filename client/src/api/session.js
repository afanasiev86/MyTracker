const TOKEN_KEY = 'mytracker_token';
const ROLE_KEY = 'mytracker_role';

// Событие для всего приложения: токен истёк или недействителен
export const UNAUTHORIZED_EVENT = 'mytracker:unauthorized';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
};

// Роль: owner (владелец) или client (заказчик с порталом). По умолчанию владелец.
export const getRole = () => localStorage.getItem(ROLE_KEY) || 'owner';
export const setRole = (role) => localStorage.setItem(ROLE_KEY, role);
