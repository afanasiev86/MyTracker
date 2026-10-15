import { describe, it, expect } from '@jest/globals';
import { validateCompose } from '../src/services/uat/validateCompose.js';

const DIR = '/srv/uat/shop';
const PORT = 4123;

// Вывод `docker compose config` для нормального стенда: приложение и база, наружу только приложение
const good = () => ({
  services: {
    app: {
      build: { context: `${DIR}/repo` },
      ports: [{ mode: 'ingress', host_ip: '127.0.0.1', target: 3100, published: '4123', protocol: 'tcp' }],
      volumes: [{ type: 'volume', source: 'uploads', target: '/app/uploads' }],
      env_file: [{ path: `${DIR}/app.env` }],
    },
    db: { image: 'mongo:7.0', volumes: [{ type: 'volume', source: 'data', target: '/data/db' }] },
  },
  networks: { default: { name: 'uat-shop_default' } },
  volumes: { uploads: {}, data: {} },
});

const check = (mutate) => {
  const config = good();
  mutate(config);
  return validateCompose(config, { dir: DIR, port: PORT });
};

describe('проверка compose-файла стенда', () => {
  it('обычный стенд проходит', () => {
    expect(validateCompose(good(), { dir: DIR, port: PORT })).toEqual([]);
  });

  it('доступ к docker.sock и папкам хоста вне стенда запрещён, папки внутри стенда можно', () => {
    expect(check((c) => c.services.app.volumes.push({ type: 'bind', source: '/var/run/docker.sock', target: '/s' }))).toEqual([expect.stringContaining('вне папки стенда')]);
    expect(check((c) => c.services.app.volumes.push({ type: 'bind', source: '/srv/uat/shop/../mytracker', target: '/s' }))).toHaveLength(1);
    expect(check((c) => c.services.app.volumes.push({ type: 'bind', source: `${DIR}/repo/data`, target: '/d' }))).toEqual([]);
  });

  it('привилегии и доступ к хосту запрещены', () => {
    for (const field of ['privileged', 'network_mode', 'pid', 'cap_add', 'devices', 'security_opt', 'container_name']) {
      const value = field === 'privileged' ? true : field === 'network_mode' ? 'host' : field === 'pid' ? 'host' : ['x'];
      expect(check((c) => { c.services.app[field] = value; })).toEqual([`Сервис app: поле ${field} запрещено`]);
    }
  });

  it('порт можно публиковать только на 127.0.0.1 и только выданный стенду', () => {
    expect(check((c) => { c.services.app.ports[0].host_ip = '0.0.0.0'; })).toEqual([expect.stringContaining('только на 127.0.0.1')]);
    expect(check((c) => { c.services.app.ports[0].host_ip = undefined; })).toHaveLength(1);
    expect(check((c) => { c.services.app.ports[0].published = '8080'; })).toEqual([expect.stringContaining('должен быть')]);
  });

  it('база наружу не публикуется, а без порта приложения стенд бесполезен', () => {
    expect(check((c) => { c.services.db.ports = [{ host_ip: '127.0.0.1', target: 27017, published: '27017' }]; })).toEqual([expect.stringContaining('больше чем один порт')]);
    expect(check((c) => { delete c.services.app.ports; })).toEqual([expect.stringContaining('Ни один сервис')]);
  });

  it('сборка и env_file вне папки стенда запрещены', () => {
    expect(check((c) => { c.services.app.build.context = '/srv/mytracker'; })).toEqual([expect.stringContaining('контекст сборки')]);
    expect(check((c) => { c.services.app.env_file = [{ path: '/srv/mytracker/server/.env' }]; })).toEqual([expect.stringContaining('env_file')]);
    expect(check((c) => { c.services.app.build.additional_contexts = { x: '/etc' }; })).toHaveLength(1);
  });

  it('внешние сети и тома, host-сеть и driver_opts запрещены', () => {
    expect(check((c) => { c.networks.shared = { external: true }; })).toEqual([expect.stringContaining('внешние сети')]);
    expect(check((c) => { c.networks.h = { driver: 'host' }; })).toHaveLength(1);
    expect(check((c) => { c.volumes.data = { external: true }; })).toHaveLength(1);
    expect(check((c) => { c.volumes.data = { driver_opts: { type: 'none', o: 'bind', device: '/' } }; })).toHaveLength(1);
  });

  it('пустой compose и секреты из чужих файлов отклоняются', () => {
    expect(validateCompose({ services: {} }, { dir: DIR, port: PORT })).toHaveLength(1);
    expect(check((c) => { c.secrets = { key: { file: '/root/.ssh/id_rsa' } }; })).toEqual([expect.stringContaining('вне папки стенда')]);
  });
});
