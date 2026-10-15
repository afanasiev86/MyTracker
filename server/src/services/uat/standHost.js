import { domainError } from '../errors.js';

// Имена, которые нельзя отдавать проектам: на них держится сам сервер
const RESERVED = new Set(['www', 'api', 'mail', 'smtp', 'imap', 'ftp', 'ns1', 'ns2', 'admin', 'tracker', 'uat']);
// Метка DNS: латиница, цифры и дефис внутри, до 63 символов. Тот же шаблон проверяет deploy/uat-expose.sh.
const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

// Адрес стенда проекта: <slug>.<домен>. Ошибки — DomainError.
export function standHost(slug, domain) {
  if (!domain) throw domainError('unavailable', 'UAT-стенды выключены: не задан UAT_DOMAIN');
  if (!LABEL.test(slug) || RESERVED.has(slug)) {
    throw domainError('invalid', `Код проекта «${slug}» не подходит для адреса стенда`);
  }
  return `${slug}.${domain}`;
}
