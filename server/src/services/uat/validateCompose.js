import path from 'node:path';

// Поля сервиса, которые дают контейнеру доступ к хосту или к чужим контейнерам. Compose-файл пишет Claude по
// репозиторию проекта, а текст репозитория может содержать чужие указания, поэтому запрет проверяет код, а не просьба в skill.
const FORBIDDEN_SERVICE_FIELDS = [
  'privileged', 'network_mode', 'pid', 'ipc', 'uts', 'userns_mode', 'cgroup', 'cgroup_parent',
  'cap_add', 'devices', 'device_cgroup_rules', 'security_opt', 'container_name',
];

const inside = (dir, target) => {
  const root = path.posix.resolve(dir);
  const resolved = path.posix.resolve(root, String(target));
  return resolved === root || resolved.startsWith(`${root}/`);
};

// Проверяет вывод `docker compose config --no-env-resolution --format json`: стенд не должен выходить за свою папку,
// открывать порты наружу и подключаться к чужим сетям. dir — папка стенда, port — единственный порт, который можно опубликовать.
// Возвращает список нарушений; пустой список — файл можно запускать.
export function validateCompose(config, { dir, port }) {
  const problems = [];
  const services = Object.entries(config?.services ?? {});
  if (services.length === 0) return ['В compose-файле нет ни одного сервиса'];

  const published = [];
  for (const [name, service] of services) {
    for (const field of FORBIDDEN_SERVICE_FIELDS) {
      if (service[field] !== undefined && service[field] !== null && service[field] !== false) {
        problems.push(`Сервис ${name}: поле ${field} запрещено`);
      }
    }
    for (const mount of service.volumes ?? []) {
      if (mount.type === 'bind' && !inside(dir, mount.source)) {
        problems.push(`Сервис ${name}: папка хоста ${mount.source} вне папки стенда`);
      }
    }
    const context = service.build?.context;
    if (context && !inside(dir, context)) problems.push(`Сервис ${name}: контекст сборки ${context} вне папки стенда`);
    if (service.build?.additional_contexts) problems.push(`Сервис ${name}: additional_contexts запрещены`);
    for (const file of service.env_file ?? []) {
      const filePath = typeof file === 'string' ? file : file.path;
      if (!inside(dir, filePath)) problems.push(`Сервис ${name}: env_file ${filePath} вне папки стенда`);
    }
    for (const item of service.ports ?? []) {
      published.push(String(item.published));
      if (item.host_ip !== '127.0.0.1') {
        problems.push(`Сервис ${name}: порт ${item.published ?? item.target} нужно публиковать только на 127.0.0.1`);
      }
    }
  }

  if (published.length === 0) problems.push(`Ни один сервис не публикует порт: нужно 127.0.0.1:\${UAT_PORT}:<порт приложения>`);
  else if (published.length > 1) problems.push('Опубликован больше чем один порт: наружу выходит только приложение, база и остальное нет');
  else if (published[0] !== String(port)) problems.push(`Опубликован порт ${published[0]}, а должен быть \${UAT_PORT} (${port})`);

  for (const [name, network] of Object.entries(config.networks ?? {})) {
    if (network?.external) problems.push(`Сеть ${name}: внешние сети запрещены`);
    if (network?.driver === 'host') problems.push(`Сеть ${name}: драйвер host запрещён`);
  }
  for (const [name, volume] of Object.entries(config.volumes ?? {})) {
    if (volume?.external) problems.push(`Том ${name}: внешние тома запрещены`);
    if (volume?.driver_opts) problems.push(`Том ${name}: driver_opts запрещены (через них можно подключить папку хоста)`);
  }
  for (const [name, item] of [...Object.entries(config.secrets ?? {}), ...Object.entries(config.configs ?? {})]) {
    if (item?.file && !inside(dir, item.file)) problems.push(`${name}: файл ${item.file} вне папки стенда`);
  }
  return problems;
}
