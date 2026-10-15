# UAT-стенды

Кратко: результат задач попадает в ветку UAT, а проект открывается на отдельном адресе `https://<код проекта>.<домен>`, закрытом входом по паролю владельца трекера. После каждого запуска Claude, который отправил результат в UAT, стенд пересобирается из ветки UAT. Ветки UAT и приёмка: `docs/architecture/run-pipeline.md:L21#Рабочая копия`.

## Адрес, сертификат, защита
1. Сервер настраивается один раз скриптом `deploy/uat-setup.sh` (пошагово: `docs/RUNBOOK.md:L98#3d. UAT-стенды: настройка сервера (≈5 минут, один раз)`). Нужна DNS-запись `A *` на IP сервера.
2. Домен берётся из `UAT_DOMAIN` (`server/src/config.js:L25@UAT_DOMAIN`), папка стендов из `UAT_DIR` (по умолчанию `/srv/uat`). Без домена стенды выключены.
3. Адрес стенда: `server/src/services/uat/standHost.js:L9-15#standHost`. Имя проекта должно быть меткой DNS (до 63 символов, латиница, цифры, дефис) и не из списка зарезервированных (`www`, `api`, `tracker` и др.). Тот же шаблон проверяет `deploy/uat-expose.sh`.
4. Порт стенда выдаётся проекту один раз (поле `Project.uatPort`) и больше не меняется: `server/src/services/uat/ports.js:L8-14#pickPort`, диапазон 4100–4999.
5. `server/src/services/uat/ensureStand.js:L38-42#ensureStand` выдаёт порт и запускает через sudo `/usr/local/sbin/uat-expose <код> <порт>`. Выдача портов идёт по одному, чтобы два проекта не получили один порт.
6. `deploy/uat-expose.sh` (root-копия в `/usr/local/sbin`): проверяет аргументы, при первом запуске выпускает сертификат Let's Encrypt для `<код>.<домен>` (`certbot certonly --nginx`, HTTP-01, API reg.ru не нужен) и пишет `/etc/nginx/conf.d/uat-<код>.conf`: редирект на HTTPS, вход (см. ниже), проксирование на `127.0.0.1:<порт>` с поддержкой WebSocket. Если nginx не принял правило, оно удаляется. Повторный запуск безопасен.

## Вход на стенды
Basic auth nginx для стендов не подходит: приложения стендов сами отправляют заголовок `Authorization: Bearer …`, а nginx принимает его за чужой пароль, отвечает `401` с `WWW-Authenticate`, и браузер показывает окно логина после каждого входа в приложение. Поэтому защита построена на cookie:
- на каждый запрос к стенду nginx спрашивает `auth_request` у API трекера (`GET /api/uat-gate/check`, `server/src/routes/uatGate.js:L73@router.get('/check'`). Нет пропуска: `302` на форму `/__uat/login` (она тоже обслуживается API трекера, `server/src/routes/uatGate.js:L52@router.get('/login'`);
- пароль тот же, что у владельца трекера (`ADMIN_PASSWORD`: `server/src/services/auth/password.js:L5-12#checkPassword`), попыток не больше 10 за 15 минут с адреса. После входа ставится cookie `uat_gate` (HttpOnly, Secure, 30 дней), заголовок `Authorization` приложения никак не затрагивается;
- пропуск — не JWT: `server/src/services/uat/gateCookie.js:L31-39#checkGateCookie` проверяет подпись HMAC, срок, хост и версию токенов. Его нельзя использовать как токен владельца в API трекера, он подходит только тому стенду, для которого выдан, а «Завершить все сессии» закрывает и стенды;
- маршруты `/api/uat-gate/*` публичные, но работают только для адресов `<код>.<UAT_DOMAIN>` (остальное `404`). Адрес `/__uat/check` снаружи недоступен (`internal`).
Ограничение: после входа возврат идёт на путь без параметров запроса (`?…` теряется).

## Сборка стенда
Запускается из воркера, когда запуск закончился статусом «На проверке» и проект не пушит сразу в ПРОД: `server/src/worker/runTask.js:L117@requestDeploy(task.project)`.
1. `server/src/services/uat/requestDeploy.js:L37-42#requestDeploy` ставит проект в очередь. Сборки идут по одной (память сервера общая). Проект, запрошенный повторно, пока ждёт или собирается, собирается ещё раз после текущей. Статус и итог пишутся в `Project.uatStatus` (`building`, `ready`, `failed`), `uatCommit`, `uatBuiltAt`, `uatError`; владельцу уходит сообщение в Telegram. После перезапуска сервера зависшая сборка помечается ошибкой: `server/src/index.js:L19@failInterruptedDeploys`.
2. `server/src/services/uat/deployStand.js:L54-96#deployStand` по шагам:
   - ветка UAT забирается в `<UAT_DIR>/<код>/repo` (отдельный клон, не тот, где работает Claude): `server/src/services/uat/syncStandRepo.js:L9-22#syncStandRepo`;
   - в `.env` рядом пишутся `UAT_PORT`, `STAND_HOST`, `STAND_URL` и три пароля `STAND_SECRET_A/B/C` (создаются один раз и не меняются, потому что база уже хранит старые): `server/src/services/uat/standFiles.js:L45-56#writeStandEnv`;
   - если рецепта нет, его пишет Claude (см. ниже);
   - рецепт проверяется: `docker compose config --no-env-resolution --format json` и правила безопасности `server/src/services/uat/validateCompose.js:L19-67#validateCompose`;
   - `docker compose -p uat-<код> up -d --build --wait`, затем один раз, при первом запуске, команда `seed` из рецепта внутри контейнера приложения, затем проверка `healthPath` (ответ ниже 500; `401` засчитывается: логин проверяет nginx, а не приложение).
3. Журнал последней сборки: `<UAT_DIR>/<код>/deploy.log`. Данные базы стенда живут в томе docker и пересборкой не стираются.

## Рецепт: Claude по skill `deploy-uat`
Рецепт — два файла в папке стенда рядом с `repo/` (не в репозитории проекта): `compose.yml` и `stand.json` (`service`, `healthPath`, необязательный `seed`; формат в `server/src/services/uat/standFiles.js:L17@recipeSchema`). Их пишет Claude: `server/src/services/uat/makeRecipe.js:L17-38#makeRecipe` запускает `claude` в папке стенда по инструкции `.claude/skills/deploy-uat/SKILL.md`. Инструментов запуска команд у него нет, только чтение репозитория и запись файлов.
- Рецепт переписывается, только если его нет или он перестал работать (не проходит проверку или не собирается). Claude получает причину: нарушенные правила или конец журнала. Не больше двух попыток за сборку.
- Пока рецепт работает, Claude не вызывается: следующие сборки это `git pull`, `docker compose up --build`.

## Правила безопасности для compose-файла
Compose-файл пишет Claude по репозиторию проекта, а текст репозитория может содержать чужие указания, поэтому запреты проверяет код (`validateCompose`), а не просьба в skill:
- опубликован ровно один порт, `127.0.0.1:<UAT_PORT>:<порт приложения>`;
- запрещены `privileged`, `network_mode`, `pid`, `ipc`, `uts`, `userns_mode`, `cgroup`, `cap_add`, `devices`, `security_opt`, `container_name`;
- папки хоста (bind) и `env_file`, `build.context`, файлы `secrets`/`configs` только внутри папки стенда (это закрывает `docker.sock`, `/etc`, `.env` самого трекера);
- запрещены внешние сети и тома, драйвер `host`, `driver_opts` у томов;
- `docker` запускается с окружением без секретов сервера (`childEnv`), иначе `${JWT_SECRET}` в compose-файле подставил бы секрет трекера.
Побочный эффект: приложение, которому нужен `docker.sock`, получает стенд без этой функции.

## В карточке задачи
`GET /api/tasks/:id` отдаёт поле `stand` (`server/src/services/uat/standInfo.js:L7-19#standInfo`), блок `client/src/components/task/StandBlock.jsx:L7-24#StandBlock` показывает «Стенд UAT: ссылка» с коммитом, «собирается» или причину ошибки. Пока стенд собирается, карточка сама обновляется.

## В карточке проекта
Блок «На сервере» (`client/src/components/project/ProjectServerCard.jsx:L20-118#ProjectServerCard`, только при редактировании) берёт данные из `GET /api/projects/:id/server` (`server/src/routes/projects/serverInfo.js:L7-16#serverInfo`, сводка `server/src/services/projects/serverInfo.js:L8-25#projectServerInfo`):
- локальная копия: есть ли папка `REPOS_DIR/<код>`, путь и размер (`du -sb`, вместе с `node_modules`): `server/src/services/projects/localCopy.js:L9-19#localCopy`;
- статус стенда: итог последней сборки из проекта плюс то, что реально запущено (`docker ps` по метке проекта compose `uat-<код>`): запущен, остановлен, собирается, ошибка сборки, не запускался;
- память стенда: сумма `docker stats --no-stream` по запущенным контейнерам, показывается, только если стенд запущен: `server/src/services/uat/standRuntime.js:L15-28#standRuntime`.
Кнопка «Запустить UAT» показывается, пока стенд ни разу не собирался: `POST /api/projects/:id/uat` (`server/src/routes/projects/startStand.js:L7-17#startStand`, сервис `server/src/services/uat/startStand.js:L10-19#startStand`) ставит статус «собирается» и запускает ту же сборку в фоне (ответ 202). Ветки UAT к этому моменту может не быть: `syncStandRepo` создаёт её от основной (`server/src/worker/worktree.js:L16-20#ensureRemoteBranch`, нужен токен GitHub с правом записи). Пока стенд собирается, блок обновляется сам раз в 5 секунд.
Под таблицей кнопка «Показать .env» (`client/src/components/project/StandEnvViewer.jsx:L8-62#StandEnvViewer`): просмотр файла `<UAT_DIR>/<код>/.env` (`UAT_PORT`, `STAND_HOST`, `STAND_URL`, `STAND_SECRET_A/B/C`), `GET /api/projects/:id/uat/env` (`server/src/routes/projects/standEnv.js:L8-18#standEnv`, разбор `server/src/services/uat/readStandEnv.js:L10-23#readStandEnv`). Файл загружается только по кнопке, пароли (ключи с SECRET, PASSWORD, TOKEN, KEY) скрыты, пока их не покажут по одному. Маршрут отвечает только токену владельца (`sub = owner`): токен воркера, которым работает Claude, получает 403, иначе Claude прочитал бы пароли стендов через скрипт трекера. Остальные переменные приложения лежат в `compose.yml` рядом и в этом просмотре не показываются.
У проекта, который пушит сразу в ПРОД, стенда нет. Вне Linux-сервера размер и docker недоступны (поля пустые).

## Ошибки и граничные случаи
- Домен и почту `uat-expose.sh` берёт из `/etc/mytracker-uat.conf` (пишет `uat-setup.sh`, принадлежит root), а не из аргументов: вызывающий процесс без привилегий их не подменит.
- Нет sudo-права: ошибка с подсказкой выполнить `deploy/uat-setup.sh`.
- Сертификат не выпускается, если DNS `*` ещё не указывает на сервер.
- `uat-setup.sh` добавляет `default_server` с отказом (`return 444`, `ssl_reject_handshake`). Если `default_server` уже объявлен в другом файле nginx, скрипт откатывает изменение и сообщает об этом.
- Чтобы наполнить базу стенда заново: `docker compose -p uat-<код> down -v` и удалить файл `initialized` в папке стенда, после чего следующая сборка выполнит seed.
- Лимиты Let's Encrypt на число сертификатов для одного домена достаточны для десятков проектов (точное число в этом документе не проверялось).

## Тесты
`server/test/uatStand.test.js` (адрес, порты, `ensureStand`), `server/test/validateCompose.test.js` (правила), `server/test/deployStand.test.js` (порядок шагов, рецепт, seed один раз), `server/test/requestDeploy.test.js` (очередь), `server/test/projectServer.test.js` (копия, память, сводка), `server/test/startStand.test.js` (кнопка и забор ветки), `server/test/standEnv.test.js` (разбор .env, доступ только владельцу), `client/src/components/project/StandEnvViewer.test.jsx`, `client/src/components/task/StandBlock.test.jsx`, `client/src/components/project/ProjectServerCard.test.jsx`. Скрипты проверены в контейнерах: проверка аргументов, генерация правила, `nginx -t`; реальный выпуск сертификата и sudo проверены на VPS. Реальная сборка стенда `docker compose` и запуск Claude по skill в тестах подменены.
