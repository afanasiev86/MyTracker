import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getConfig } from '../config.js';
import { checkPassword } from '../services/auth/password.js';
import { checkGateCookie, gateCookieHeader, issueGateValue } from '../services/uat/gateCookie.js';

// Вход на UAT-стенды. nginx стенда спрашивает /check на каждый запрос (auth_request), без пропуска отправляет
// на форму входа /login. Своё приложение стенда может использовать заголовок Authorization (Bearer-токены),
// поэтому basic auth nginx для стендов не подходит: пропуск лежит в cookie, пароль тот же, что у владельца трекера.
// Маршруты публичные, но работают только для адресов <код>.<UAT_DOMAIN>.
const router = Router();
router.use(express.urlencoded({ extended: false, limit: '4kb' }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).type('html').send(page({ error: 'Слишком много попыток. Подождите 15 минут.' })),
});

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Только путь на этом же сайте: «//host» и «/\host» открыли бы чужой адрес
const safeNext = (value) => (/^\/(?![/\\])[^\r\n]*$/.test(String(value ?? '')) ? String(value) : '/');

function page({ next = '/', error = '' }) {
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Вход на стенд</title>
<style>body{font-family:system-ui,sans-serif;background:#f5f5f5;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
form{background:#fff;padding:24px;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.15);width:min(92vw,340px)}
h1{font-size:18px;margin:0 0 8px}p{color:#666;font-size:14px;margin:0 0 16px}
input[type=password]{width:100%;box-sizing:border-box;padding:8px;margin-bottom:12px;font-size:16px}
button{width:100%;padding:10px;font-size:16px;background:#1677ff;color:#fff;border:0;border-radius:6px}
.err{color:#cf1322;font-size:14px;margin-bottom:12px}</style></head>
<body><form method="post" action="/__uat/login">
<h1>UAT-стенд</h1><p>Введите пароль владельца трекера, тот же, что для входа в трекер.</p>
${error ? `<div class="err">${escapeHtml(error)}</div>` : ''}
<input type="password" name="password" autocomplete="current-password" autofocus required>
<input type="hidden" name="next" value="${escapeHtml(next)}">
<button type="submit">Войти</button></form></body></html>`;
}

// Хост стенда из запроса nginx; не стенд (например, сам домен трекера) — null
function standHostOf(req) {
  const { domain } = getConfig().uat;
  const host = String(req.headers.host || '').split(':')[0].toLowerCase();
  return domain && host.endsWith(`.${domain}`) ? host : null;
}

router.get('/login', (req, res) => {
  if (!standHostOf(req)) return res.status(404).end();
  res.set('Cache-Control', 'no-store').set('X-Frame-Options', 'DENY');
  return res.type('html').send(page({ next: safeNext(req.query.next) }));
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const host = standHostOf(req);
    if (!host) return res.status(404).end();
    const target = safeNext(req.body?.next);
    if (!checkPassword(req.body?.password ?? '')) {
      return res.status(401).set('Cache-Control', 'no-store').type('html').send(page({ next: target, error: 'Неверный пароль' }));
    }
    res.set('Set-Cookie', gateCookieHeader(await issueGateValue(host)));
    return res.redirect(303, target);
  } catch (err) {
    return next(err);
  }
});

router.get('/check', async (req, res, next) => {
  try {
    const host = standHostOf(req);
    return host && await checkGateCookie(req.headers.cookie, host) ? res.status(204).end() : res.status(401).end();
  } catch (err) {
    return next(err);
  }
});

export default router;
