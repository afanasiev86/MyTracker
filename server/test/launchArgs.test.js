import { launchArgs } from '../src/worker/launchArgs.js';
import { claudeTools, TRACKER_CLI } from '../src/worker/claudeTools.js';

describe('аргументы запуска claude', () => {
  const prompt = (args) => args[args.indexOf('-p') + 1];

  it('в запуске и в разрешениях один и тот же полный путь к скрипту трекера', () => {
    const args = launchArgs({ taskId: 'abc', answer: '', sessionId: '', screenshots: [] });
    expect(prompt(args)).toContain(TRACKER_CLI);
    expect(claudeTools()).toContain(`Bash(${TRACKER_CLI} *)`);
  });

  it('путь передаётся и при ответе на вопрос в той же сессии', () => {
    const args = launchArgs({ taskId: 'abc', answer: 'да', sessionId: 's1', screenshots: [] });
    expect(prompt(args)).toContain('да');
    expect(prompt(args)).toContain(TRACKER_CLI);
    expect(args).toContain('--resume');
  });
});
