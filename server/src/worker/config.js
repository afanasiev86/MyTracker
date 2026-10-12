// Настройки воркера из переменных окружения
export function workerConfig() {
  return {
    reposDir: process.env.REPOS_DIR,
    worktreesDir: process.env.WORKTREES_DIR,
    base: process.env.DEFAULT_BRANCH || 'main',
    claudeBin: process.env.CLAUDE_BIN || 'claude',
    apiUrl: process.env.TRACKER_API_URL || `http://localhost:${process.env.PORT || 3001}/api`,
    timeoutMin: Number(process.env.RUN_TIMEOUT_MIN) || 30,
  };
}
