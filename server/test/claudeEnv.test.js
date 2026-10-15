import { describe, it, expect } from '@jest/globals';
import { claudeEnv } from '../src/worker/env.js';

// Окружение процесса claude: без сохранённого аккаунта (credential=null) не меняется — воркер использует
// аккаунт, залогиненный на сервере, как раньше. С сохранённым аккаунтом подставляется нужная переменная.
describe('окружение claude: переключение аккаунта', () => {
  it('без сохранённого аккаунта окружение не меняется', () => {
    const base = { PATH: '/bin', HOME: '/h' };
    expect(claudeEnv(base, null)).toEqual(base);
  });

  it('ключ api_key подставляется в ANTHROPIC_API_KEY', () => {
    const base = { PATH: '/bin' };
    const env = claudeEnv(base, { token: 'sk-ant-xyz', type: 'api_key' });
    expect(env).toEqual({ PATH: '/bin', ANTHROPIC_API_KEY: 'sk-ant-xyz' });
  });

  it('долгоживущий токен подставляется в CLAUDE_CODE_OAUTH_TOKEN', () => {
    const base = { PATH: '/bin' };
    const env = claudeEnv(base, { token: 'oauth-xyz', type: 'oauth_token' });
    expect(env).toEqual({ PATH: '/bin', CLAUDE_CODE_OAUTH_TOKEN: 'oauth-xyz' });
  });

  it('сохранённый аккаунт заменяет ключ сервера, а не добавляется рядом', () => {
    const base = { PATH: '/bin', ANTHROPIC_API_KEY: 'server-key' };
    const env = claudeEnv(base, { token: 'oauth-xyz', type: 'oauth_token' });
    expect(env).toEqual({ PATH: '/bin', CLAUDE_CODE_OAUTH_TOKEN: 'oauth-xyz' });
  });
});
